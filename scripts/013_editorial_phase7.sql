-- =============================================================================
-- Phase 7 — Publishing Engine
-- Reino Editorial AI Engine
-- =============================================================================
-- Tables introduced in this migration:
--
--   editorial_publication_versions   — a "ready to publish" snapshot, distinct
--                                      from working document_versions (Phase 6)
--   editorial_publication_metadata   — structured bibliographic / commercial
--                                      metadata for a publication version
--   editorial_export_runs            — one row per export attempt (PDF/EPUB/KDP)
--   editorial_distribution_packages  — assembled distribution bundles ready for
--                                      a specific retail channel
--
-- Rationale for each table:
--   publication_versions   The working document_versions table (Phase 6) is a
--                          fine-grained change log. A publication_version is a
--                          formal milestone: "this content is approved for
--                          publication". The separation keeps editorial flow
--                          clean and avoids polluting the change log with
--                          publishing-concern states.
--
--   publication_metadata   Metadata is a separate, wide entity that can grow
--                          (ISBNs, publisher info, classifications) without
--                          altering the core projects table. One row per
--                          publication_version keeps versioned metadata history.
--
--   export_runs            Each export is a job with status lifecycle
--                          (queued → running → done/failed). Storing them
--                          separately lets us retry, audit, and download past
--                          exports without touching the publication_version row.
--
--   distribution_packages  Future-proofing for multi-channel distribution
--                          (KDP, Apple Books, IngramSpark). One bundle per
--                          channel per export run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

do $$ begin
  create type publication_version_status as enum (
    'draft',
    'ready',
    'exported',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type export_format as enum (
    'pdf_print',
    'epub',
    'kindle_mobi',
    'kindle_kpf',
    'html'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type export_run_status as enum (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type distribution_channel as enum (
    'amazon_kdp',
    'apple_books',
    'google_play_books',
    'ingram_spark',
    'smashwords',
    'internal'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type distribution_package_status as enum (
    'pending',
    'ready',
    'submitted',
    'accepted',
    'rejected'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. EDITORIAL PUBLICATION VERSIONS
-- ---------------------------------------------------------------------------
-- A formal "ready to publish" milestone derived from the working manuscript.
-- One project can have multiple publication versions (e.g. 1st edition, 2nd
-- edition, revised edition).

create table if not exists editorial_publication_versions (
  id                    uuid primary key default gen_random_uuid(),

  project_id            uuid not null
                          references editorial_projects(id) on delete cascade,

  -- Human label: "1st Edition", "Revised Edition – 2025", etc.
  label                 text not null,

  -- Semantic version string for programmatic tracking: "1.0.0", "2.1.0"
  version_tag           text not null,

  status                publication_version_status not null default 'draft',

  -- The working document version this publication is derived from
  source_document_version_id uuid
                          references editorial_document_versions(id)
                          on delete set null,

  -- The editorial stage that was "final" for this publication
  source_stage          text
                          check (source_stage in (
                            'ingesta','estructura','estilo',
                            'ortotipografia','maquetacion','revision_final'
                          )),

  -- Optional: the editorial file (Phase 4A) used as the primary source
  source_file_id        uuid
                          references editorial_files(id) on delete set null,

  -- Free-text editorial notes attached to this version
  editorial_notes       text,

  -- Approval workflow
  approved_by           uuid references profiles(id) on delete set null,
  approved_at           timestamptz,

  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (project_id, version_tag)
);

comment on table editorial_publication_versions is
  'Formal publish-ready milestones for a project, distinct from the working document version history.';
comment on column editorial_publication_versions.version_tag is
  'Semver-style string (e.g. "1.0.0") for programmatic tracking of editions.';

create index if not exists idx_pub_versions_project
  on editorial_publication_versions(project_id);
create index if not exists idx_pub_versions_status
  on editorial_publication_versions(project_id, status);

-- ---------------------------------------------------------------------------
-- 2. EDITORIAL PUBLICATION METADATA
-- ---------------------------------------------------------------------------
-- Bibliographic and commercial metadata for a single publication version.
-- One row per publication_version_id; structured to allow future extensibility
-- via the extra_metadata JSONB column.

create table if not exists editorial_publication_metadata (
  id                      uuid primary key default gen_random_uuid(),

  publication_version_id  uuid not null unique
                            references editorial_publication_versions(id)
                            on delete cascade,

  project_id              uuid not null
                            references editorial_projects(id) on delete cascade,

  -- Core bibliographic
  title                   text not null,
  subtitle                text,
  author_name             text,
  contributors            jsonb not null default '[]',  -- [{name, role}]

  -- Publishing info
  publisher_name          text,
  imprint                 text,
  publication_date        date,
  edition_number          integer default 1,

  -- Identifiers
  isbn_13                 text,
  isbn_10                 text,
  asin                    text,
  doi                     text,

  -- Classification
  language                text not null default 'es',
  description             text,
  keywords                text[],
  bisac_codes             text[],   -- e.g. {"FIC000000","FIC014000"}
  thema_codes             text[],

  -- Rights
  rights                  text,     -- e.g. "All rights reserved"
  territories             text[],   -- e.g. {"worldwide"} or {"US","CA"}

  -- Cover
  cover_image_url         text,
  cover_storage_path      text,

  -- Overflow / future fields
  extra_metadata          jsonb not null default '{}',

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table editorial_publication_metadata is
  'Structured bibliographic metadata tied to a single publication version.';
comment on column editorial_publication_metadata.contributors is
  'JSON array of {name, role} objects (e.g. editors, translators, illustrators).';
comment on column editorial_publication_metadata.extra_metadata is
  'Escape hatch for metadata fields not yet formally modelled (e.g. ARC codes, library classifications).';

create index if not exists idx_pub_metadata_project
  on editorial_publication_metadata(project_id);

-- ---------------------------------------------------------------------------
-- 3. EDITORIAL EXPORT RUNS
-- ---------------------------------------------------------------------------
-- One row per export attempt. Decoupled from publication_versions so retries
-- and multiple-format exports don't create version noise.

create table if not exists editorial_export_runs (
  id                      uuid primary key default gen_random_uuid(),

  project_id              uuid not null
                            references editorial_projects(id) on delete cascade,

  publication_version_id  uuid not null
                            references editorial_publication_versions(id)
                            on delete cascade,

  format                  export_format not null,
  status                  export_run_status not null default 'queued',

  -- Output file location
  output_file_url         text,
  output_storage_path     text,
  output_size_bytes       bigint,

  -- Engine metadata
  engine                  text,    -- e.g. "pandoc", "weasyprint", "calibre"
  engine_version          text,
  export_config           jsonb not null default '{}',   -- format-specific options

  -- Error tracking
  error_message           text,
  error_details           jsonb,

  -- Timing
  started_at              timestamptz,
  finished_at             timestamptz,
  duration_ms             integer
                            generated always as (
                              extract(epoch from (finished_at - started_at)) * 1000
                            ) stored,

  initiated_by            uuid references profiles(id) on delete set null,
  created_at              timestamptz not null default now()
);

comment on table editorial_export_runs is
  'Tracks every export attempt for a publication version, with status lifecycle and output file references.';

create index if not exists idx_export_runs_project
  on editorial_export_runs(project_id);
create index if not exists idx_export_runs_pub_version
  on editorial_export_runs(publication_version_id);
create index if not exists idx_export_runs_status
  on editorial_export_runs(status);
create index if not exists idx_export_runs_created
  on editorial_export_runs(project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. EDITORIAL DISTRIBUTION PACKAGES
-- ---------------------------------------------------------------------------
-- Assembles one or more export files into a channel-specific bundle.
-- Intentionally not wired to external APIs yet; just tracks readiness.

create table if not exists editorial_distribution_packages (
  id                      uuid primary key default gen_random_uuid(),

  project_id              uuid not null
                            references editorial_projects(id) on delete cascade,

  publication_version_id  uuid not null
                            references editorial_publication_versions(id)
                            on delete cascade,

  channel                 distribution_channel not null,
  status                  distribution_package_status not null default 'pending',

  -- Which export runs contributed to this package
  export_run_ids          uuid[] not null default '{}',

  -- Package manifest (file list, checksums, channel-specific fields)
  manifest                jsonb not null default '{}',

  -- Channel submission tracking
  submission_id           text,    -- channel's own tracking ID once submitted
  submitted_at            timestamptz,
  submitted_by            uuid references profiles(id) on delete set null,

  -- Channel response
  channel_response        jsonb,
  response_at             timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table editorial_distribution_packages is
  'Tracks channel-specific distribution bundles assembled from one or more export runs. Prepared for future KDP/Apple/IngramSpark integration.';

create index if not exists idx_dist_packages_project
  on editorial_distribution_packages(project_id);
create index if not exists idx_dist_packages_pub_version
  on editorial_distribution_packages(publication_version_id);
create index if not exists idx_dist_packages_channel
  on editorial_distribution_packages(channel, status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table editorial_publication_versions    enable row level security;
alter table editorial_publication_metadata    enable row level security;
alter table editorial_export_runs             enable row level security;
alter table editorial_distribution_packages   enable row level security;

-- Staff (admin/ops) may read all rows belonging to their org's projects
create policy "staff_read_pub_versions" on editorial_publication_versions
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_publication_versions.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff_read_pub_metadata" on editorial_publication_metadata
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_publication_metadata.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff_read_export_runs" on editorial_export_runs
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_export_runs.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff_read_dist_packages" on editorial_distribution_packages
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_packages.project_id
        and p.org_id = public.get_my_org_id()
    )
  );
