-- =============================================================================
-- Phase 9 — Global Book Distribution Engine
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Enables Reino Editorial to manage book distribution preparation and channel
-- tracking for major retail, POD, and aggregator platforms.
--
-- 9 new tables:
--   1. editorial_distribution_channels      — supported channel catalogue
--   2. editorial_book_metadata              — canonical distribution metadata
--   3. editorial_distribution_formats       — format records per project
--   4. editorial_distribution_submissions   — channel submission records
--   5. editorial_distribution_identifiers   — channel-assigned identifiers
--   6. editorial_distribution_artifacts     — delivery files and exports
--   7. editorial_distribution_issues        — validation and delivery issues
--   8. editorial_distribution_events        — audit trail (lifecycle events)
--   9. editorial_distribution_jobs          — async automation / sync jobs
--
-- Seed data: 6 default distribution channels.
--
-- Depends on:
--   001_schema.sql                    (profiles, organizations, auth.users)
--   009_editorial_phase4a.sql         (editorial_projects, editorial_files)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL DISTRIBUTION CHANNELS
-- ============================================================
-- Catalogue of supported publishing / retail / POD channels.
-- Managed by platform staff; seeded with major platform rows.
-- New channels can be added by inserting rows — no schema change needed.
-- ============================================================

create table if not exists editorial_distribution_channels (
  id                    uuid          primary key default gen_random_uuid(),

  -- Stable machine-readable code used in code paths (e.g. 'amazon_kdp')
  code                  text          not null unique,

  -- Human-readable name (e.g. 'Amazon KDP')
  name                  text          not null,

  -- Channel category
  channel_type          text          not null
                          check (channel_type in (
                            'retail',
                            'pod',
                            'wholesale',
                            'direct',
                            'aggregator'
                          )),

  active                boolean       not null default true,

  -- Format capabilities
  supports_print        boolean       not null default false,
  supports_ebook        boolean       not null default true,
  supports_audiobook    boolean       not null default false,

  -- Channel-specific metadata field schema (JSONB Schema or descriptor)
  metadata_schema       jsonb,

  created_at            timestamptz   not null default now()
);

comment on table editorial_distribution_channels is
  'Catalogue of supported book distribution channels (retail, POD, wholesale, aggregators).';
comment on column editorial_distribution_channels.code is
  'Stable machine-readable identifier, e.g. "amazon_kdp". Used in automation code.';
comment on column editorial_distribution_channels.channel_type is
  'Channel category: retail | pod | wholesale | direct | aggregator.';
comment on column editorial_distribution_channels.metadata_schema is
  'Optional JSONB Schema descriptor for channel-specific submission fields.';

create index if not exists idx_dist_channels_active
  on editorial_distribution_channels(active)
  where active = true;

create index if not exists idx_dist_channels_type
  on editorial_distribution_channels(channel_type);


-- ── Seed: default distribution channels ────────────────────────────────────

insert into editorial_distribution_channels
  (code, name, channel_type, supports_print, supports_ebook, supports_audiobook)
values
  ('amazon_kdp',       'Amazon KDP',           'retail',     true,  true,  false),
  ('apple_books',      'Apple Books',           'retail',     false, true,  false),
  ('google_play_books','Google Play Books',     'retail',     false, true,  false),
  ('kobo',             'Kobo Writing Life',     'retail',     false, true,  false),
  ('barnes_noble_press','Barnes & Noble Press', 'retail',     true,  true,  false),
  ('ingramspark',      'IngramSpark',           'aggregator', true,  true,  false)
on conflict (code) do nothing;


-- ============================================================
-- 2. EDITORIAL BOOK METADATA
-- ============================================================
-- Canonical, distribution-ready bibliographic metadata for a project.
-- One row per project (UNIQUE on project_id).
-- This is the single source of truth used when building submission
-- payloads for any channel.
-- ============================================================

create table if not exists editorial_book_metadata (
  id                    uuid          primary key default gen_random_uuid(),

  project_id            uuid          not null unique
                          references editorial_projects(id) on delete cascade,

  -- Core title info
  title                 text          not null,
  subtitle              text,
  series_name           text,
  series_number         text,

  -- Authorship
  author_display_name   text          not null,
  -- JSONB array of {name, role} contributor objects
  contributors          jsonb         not null default '[]',

  -- Marketing copy
  description_short     text,
  description_long      text,

  -- Publication details
  language_code         text,                 -- BCP-47, e.g. 'es', 'en'
  publication_date      date,
  edition_label         text,                 -- e.g. '1st Edition', 'Revised'

  -- Identifiers
  isbn_print            text,                 -- 13-digit ISBN for paperback
  isbn_ebook            text,                 -- 13-digit ISBN for ebook
  isbn_hardcover        text,                 -- 13-digit ISBN for hardcover

  -- Classification
  bisac_codes           text[],               -- e.g. {"FIC000000","FIC014000"}
  keywords              text[],

  -- Rights & territories
  territory_rights      text[],               -- e.g. {"worldwide"} or {"US","CA"}
  age_range             text,                 -- e.g. 'Adult', 'Young Adult', '8-12'
  audience              text,                 -- e.g. 'General', 'Trade', 'Academic'

  -- Publisher info
  copyright_holder      text,
  publisher_name        text,
  imprint_name          text,

  -- Audit
  created_by            uuid          references auth.users(id) on delete set null,
  updated_by            uuid          references auth.users(id) on delete set null,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table editorial_book_metadata is
  'Canonical distribution-ready metadata for a book project. One row per project; used to build submission payloads for any channel.';
comment on column editorial_book_metadata.contributors is
  'JSON array of {name, role} objects, e.g. [{name:"Jane Doe",role:"editor"}].';
comment on column editorial_book_metadata.bisac_codes is
  'BISAC subject codes for classification, e.g. {"FIC000000"}.';
comment on column editorial_book_metadata.territory_rights is
  'Territory codes where publishing rights are granted, e.g. {"worldwide"} or {"US","CA","MX"}.';

-- project_id is already unique, which creates an implicit index.
create index if not exists idx_book_metadata_project
  on editorial_book_metadata(project_id);


-- ============================================================
-- 3. EDITORIAL DISTRIBUTION FORMATS
-- ============================================================
-- Tracks which publication formats are enabled for a project,
-- and links the physical source files for each format.
-- UNIQUE(project_id, format_type) — one format row per type per project.
-- ============================================================

create table if not exists editorial_distribution_formats (
  id                    uuid          primary key default gen_random_uuid(),

  project_id            uuid          not null
                          references editorial_projects(id) on delete cascade,

  -- Publication format
  format_type           text          not null
                          check (format_type in (
                            'paperback',
                            'hardcover',
                            'ebook',
                            'audiobook'
                          )),

  enabled               boolean       not null default true,

  -- Source files from the editorial pipeline
  interior_file_id      uuid          references editorial_files(id) on delete set null,
  cover_file_id         uuid          references editorial_files(id) on delete set null,
  preview_file_id       uuid          references editorial_files(id) on delete set null,

  -- Physical spec (relevant for print formats)
  page_count            integer       check (page_count is null or page_count > 0),
  trim_size             text,         -- e.g. '6x9', '5.5x8.5'
  paper_type            text,         -- e.g. 'cream', 'white', 'color'
  binding_type          text,         -- e.g. 'perfect_bound', 'case_laminate'

  created_at            timestamptz   not null default now(),

  unique (project_id, format_type)
);

comment on table editorial_distribution_formats is
  'Format records per project (paperback, hardcover, ebook, audiobook). One row per format per project.';
comment on column editorial_distribution_formats.format_type is
  'Publication format: paperback | hardcover | ebook | audiobook.';
comment on column editorial_distribution_formats.interior_file_id is
  'References the manuscript interior PDF/EPUB in editorial_files.';
comment on column editorial_distribution_formats.cover_file_id is
  'References the cover file in editorial_files.';

create index if not exists idx_dist_formats_project
  on editorial_distribution_formats(project_id);

create index if not exists idx_dist_formats_format_type
  on editorial_distribution_formats(format_type);

create index if not exists idx_dist_formats_project_enabled
  on editorial_distribution_formats(project_id, enabled)
  where enabled = true;


-- ============================================================
-- 4. EDITORIAL DISTRIBUTION SUBMISSIONS
-- ============================================================
-- A submission represents one attempt to publish a project's format
-- to a specific distribution channel.
-- UNIQUE(project_id, channel_id, format_id) prevents duplicate active submissions.
-- ============================================================

create table if not exists editorial_distribution_submissions (
  id                    uuid          primary key default gen_random_uuid(),

  project_id            uuid          not null
                          references editorial_projects(id) on delete cascade,

  channel_id            uuid          not null
                          references editorial_distribution_channels(id) on delete restrict,

  -- Optional: the specific format being submitted (null = all / unspecified)
  format_id             uuid
                          references editorial_distribution_formats(id) on delete set null,

  -- Staff member who triggered the submission
  submitted_by          uuid
                          references auth.users(id) on delete set null,

  -- Full submission lifecycle
  status                text          not null default 'draft'
                          check (status in (
                            'draft',
                            'queued',
                            'validating',
                            'submitted',
                            'processing',
                            'action_required',
                            'approved',
                            'published',
                            'rejected',
                            'failed',
                            'paused',
                            'unpublished'
                          )),

  -- Data sent to the channel (channel-specific JSONB payload)
  submission_payload    jsonb,

  -- Raw response from the channel API
  channel_response      jsonb,

  -- Timestamps
  submitted_at          timestamptz,
  last_synced_at        timestamptz,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),

  -- One active submission per (project, channel, format)
  unique (project_id, channel_id, format_id)
);

comment on table editorial_distribution_submissions is
  'A submission of a project format to a distribution channel. Tracks the full publishing lifecycle on that channel.';
comment on column editorial_distribution_submissions.status is
  'Lifecycle: draft → queued → validating → submitted → processing → (action_required →)* approved → published | rejected | failed | paused | unpublished.';
comment on column editorial_distribution_submissions.submission_payload is
  'Channel-specific JSONB payload sent on submission (may contain metadata, file references, pricing, etc.).';
comment on column editorial_distribution_submissions.channel_response is
  'Raw API response from the channel for auditing and debugging.';

create index if not exists idx_dist_submissions_project
  on editorial_distribution_submissions(project_id);

create index if not exists idx_dist_submissions_channel
  on editorial_distribution_submissions(channel_id);

create index if not exists idx_dist_submissions_status
  on editorial_distribution_submissions(status);

create index if not exists idx_dist_submissions_project_status
  on editorial_distribution_submissions(project_id, status);


-- ============================================================
-- 5. EDITORIAL DISTRIBUTION IDENTIFIERS
-- ============================================================
-- Identifiers assigned by external channels after a submission
-- is approved or published (e.g. ASIN, Apple ID, Google ID).
-- Multiple identifiers can exist per submission.
-- ============================================================

create table if not exists editorial_distribution_identifiers (
  id                    uuid          primary key default gen_random_uuid(),

  submission_id         uuid          not null
                          references editorial_distribution_submissions(id) on delete cascade,

  -- Type of identifier
  identifier_type       text          not null
                          check (identifier_type in (
                            'external_book_id',
                            'asin',
                            'apple_id',
                            'google_id',
                            'kobo_id',
                            'bn_id',
                            'ingram_id',
                            'sku',
                            'listing_url',
                            'other'
                          )),

  identifier_value      text          not null,

  created_at            timestamptz   not null default now()
);

comment on table editorial_distribution_identifiers is
  'External identifiers assigned by distribution channels (ASIN, Apple ID, Kobo ID, listing URLs, etc.).';
comment on column editorial_distribution_identifiers.identifier_type is
  'Type of identifier: external_book_id | asin | apple_id | google_id | kobo_id | bn_id | ingram_id | sku | listing_url | other.';

create index if not exists idx_dist_identifiers_submission
  on editorial_distribution_identifiers(submission_id);

create index if not exists idx_dist_identifiers_type
  on editorial_distribution_identifiers(identifier_type);

create index if not exists idx_dist_identifiers_submission_type
  on editorial_distribution_identifiers(submission_id, identifier_type);


-- ============================================================
-- 6. EDITORIAL DISTRIBUTION ARTIFACTS
-- ============================================================
-- Files and generated exports associated with a distribution
-- submission (PDFs, EPUBs, cover images, compliance reports, etc.).
-- Versioned to support re-exports without losing history.
-- ============================================================

create table if not exists editorial_distribution_artifacts (
  id                    uuid          primary key default gen_random_uuid(),

  submission_id         uuid          not null
                          references editorial_distribution_submissions(id) on delete cascade,

  -- What kind of file this is
  artifact_type         text          not null
                          check (artifact_type in (
                            'metadata_export',
                            'interior_pdf',
                            'cover_pdf',
                            'epub',
                            'mobi',
                            'kpf',
                            'thumbnail',
                            'marketing_image',
                            'pod_package',
                            'compliance_report',
                            'submission_receipt',
                            'other'
                          )),

  -- Reference to the file in the editorial pipeline (if managed there)
  file_id               uuid
                          references editorial_files(id) on delete set null,

  -- Direct storage path for files not in editorial_files
  storage_path          text,

  -- Version counter: incremented with each regeneration
  version               integer       not null default 1
                          check (version >= 1),

  notes                 text,

  created_at            timestamptz   not null default now()
);

comment on table editorial_distribution_artifacts is
  'Files and generated exports per distribution submission (PDFs, EPUBs, marketing images, receipts, etc.). Versioned for re-export history.';
comment on column editorial_distribution_artifacts.artifact_type is
  'File type: metadata_export | interior_pdf | cover_pdf | epub | mobi | kpf | thumbnail | marketing_image | pod_package | compliance_report | submission_receipt | other.';
comment on column editorial_distribution_artifacts.version is
  'Version number starting at 1; incremented each time the artifact is regenerated.';

create index if not exists idx_dist_artifacts_submission
  on editorial_distribution_artifacts(submission_id);

create index if not exists idx_dist_artifacts_type
  on editorial_distribution_artifacts(artifact_type);

create index if not exists idx_dist_artifacts_submission_type
  on editorial_distribution_artifacts(submission_id, artifact_type);


-- ============================================================
-- 7. EDITORIAL DISTRIBUTION ISSUES
-- ============================================================
-- Validation errors, warnings, or channel-reported problems
-- linked to a submission. Supports a resolution workflow.
-- ============================================================

create table if not exists editorial_distribution_issues (
  id                    uuid          primary key default gen_random_uuid(),

  submission_id         uuid          not null
                          references editorial_distribution_submissions(id) on delete cascade,

  -- Severity level
  severity              text          not null
                          check (severity in ('info', 'warning', 'error', 'critical')),

  -- Machine-readable error code (e.g. 'COVER_RESOLUTION_TOO_LOW')
  issue_code            text,

  -- Human-readable title and detail
  title                 text          not null,
  description           text,

  -- The metadata field or submission path that caused the issue
  field_path            text,

  -- Issue resolution lifecycle
  status                text          not null default 'open'
                          check (status in ('open', 'acknowledged', 'resolved', 'ignored')),

  -- Resolution info
  resolved_by           uuid          references auth.users(id) on delete set null,
  resolved_at           timestamptz,

  created_at            timestamptz   not null default now()
);

comment on table editorial_distribution_issues is
  'Validation errors and channel-reported issues for a submission. Includes a resolution workflow (open → acknowledged → resolved | ignored).';
comment on column editorial_distribution_issues.issue_code is
  'Machine-readable code for the issue type, e.g. "COVER_RESOLUTION_TOO_LOW".';
comment on column editorial_distribution_issues.field_path is
  'Dot-notation path to the problematic field, e.g. "metadata.isbn_print" or "cover_file".';

create index if not exists idx_dist_issues_submission
  on editorial_distribution_issues(submission_id);

create index if not exists idx_dist_issues_severity
  on editorial_distribution_issues(severity);

create index if not exists idx_dist_issues_status
  on editorial_distribution_issues(status);

create index if not exists idx_dist_issues_submission_open
  on editorial_distribution_issues(submission_id, status)
  where status in ('open', 'acknowledged');


-- ============================================================
-- 8. EDITORIAL DISTRIBUTION EVENTS
-- ============================================================
-- Immutable audit trail for all submission lifecycle changes.
-- One row per state transition or significant action.
-- Written by the application / workers — not user-editable.
-- ============================================================

create table if not exists editorial_distribution_events (
  id                    uuid          primary key default gen_random_uuid(),

  submission_id         uuid          not null
                          references editorial_distribution_submissions(id) on delete cascade,

  -- Discriminator for the type of event
  event_type            text          not null,

  -- Actor who caused the event (null = automated / system)
  actor_user_id         uuid          references auth.users(id) on delete set null,

  -- Status transition (both can be null for non-transition events)
  old_status            text,
  new_status            text,

  -- Arbitrary event-specific data
  payload               jsonb,

  created_at            timestamptz   not null default now()
);

comment on table editorial_distribution_events is
  'Immutable audit trail for submission lifecycle events. One row per state transition or significant action (manual or automated).';
comment on column editorial_distribution_events.event_type is
  'e.g. "status_changed", "artifact_generated", "identifier_received", "issue_opened", "validation_completed".';
comment on column editorial_distribution_events.actor_user_id is
  'NULL when the event was triggered by an automated job or system process.';

create index if not exists idx_dist_events_submission
  on editorial_distribution_events(submission_id);

create index if not exists idx_dist_events_type
  on editorial_distribution_events(event_type);

create index if not exists idx_dist_events_created
  on editorial_distribution_events(created_at desc);

create index if not exists idx_dist_events_submission_created
  on editorial_distribution_events(submission_id, created_at desc);


-- ============================================================
-- 9. EDITORIAL DISTRIBUTION JOBS
-- ============================================================
-- Async automation jobs for distribution processing: metadata preparation,
-- export generation, channel submission, status polling, etc.
-- Designed for integration with a job queue or serverless workers.
-- ============================================================

create table if not exists editorial_distribution_jobs (
  id                    uuid          primary key default gen_random_uuid(),

  -- Context references (at least one must be set; submission may be null for prep jobs)
  submission_id         uuid
                          references editorial_distribution_submissions(id) on delete cascade,

  project_id            uuid
                          references editorial_projects(id) on delete cascade,

  channel_id            uuid
                          references editorial_distribution_channels(id) on delete set null,

  -- Job classification
  job_type              text          not null
                          check (job_type in (
                            'prepare_metadata',
                            'validate_package',
                            'generate_export',
                            'submit_to_channel',
                            'sync_status',
                            'pull_identifiers',
                            'publish',
                            'unpublish',
                            'retry_failed_submission'
                          )),

  -- Job status
  status                text          not null default 'queued'
                          check (status in (
                            'queued',
                            'running',
                            'succeeded',
                            'failed',
                            'cancelled'
                          )),

  -- Retry tracking
  attempt_count         integer       not null default 0
                          check (attempt_count >= 0),

  -- Scheduling & timing
  scheduled_at          timestamptz,
  started_at            timestamptz,
  finished_at           timestamptz,

  -- Input/output payloads for the worker
  input_payload         jsonb,
  output_payload        jsonb,
  error_message         text,

  created_at            timestamptz   not null default now(),

  -- At least project_id or submission_id must be provided
  constraint chk_jobs_has_context
    check (project_id is not null or submission_id is not null)
);

comment on table editorial_distribution_jobs is
  'Async jobs for distribution automation: metadata prep, export generation, channel submission, status polling, etc.';
comment on column editorial_distribution_jobs.job_type is
  'prepare_metadata | validate_package | generate_export | submit_to_channel | sync_status | pull_identifiers | publish | unpublish | retry_failed_submission.';
comment on column editorial_distribution_jobs.status is
  'queued → running → succeeded | failed | cancelled.';
comment on column editorial_distribution_jobs.attempt_count is
  'Number of execution attempts. Incremented each time the worker picks up the job.';
comment on column editorial_distribution_jobs.scheduled_at is
  'If set, the job should not be started before this timestamp.';

create index if not exists idx_dist_jobs_submission
  on editorial_distribution_jobs(submission_id);

create index if not exists idx_dist_jobs_project
  on editorial_distribution_jobs(project_id);

create index if not exists idx_dist_jobs_channel
  on editorial_distribution_jobs(channel_id);

create index if not exists idx_dist_jobs_type
  on editorial_distribution_jobs(job_type);

create index if not exists idx_dist_jobs_status
  on editorial_distribution_jobs(status);

-- Index for the worker polling pattern: find queued/runnable jobs
create index if not exists idx_dist_jobs_queue_poll
  on editorial_distribution_jobs(status, scheduled_at)
  where status in ('queued', 'running');


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Staff (superadmin, admin, ops) can fully manage all distribution records.
--   2. Authors who own a project (created_by = auth.uid()) can read distribution
--      status and metadata for their own projects.
--   3. Channel config (editorial_distribution_channels) is read-only for all
--      authenticated users; only staff can insert/update.
--   4. Submission, issue, artifact, event, and job writes are staff/service-role only.
--   5. Audit tables (events) are readable by the project owner; not writable.
-- =============================================================================

alter table editorial_distribution_channels     enable row level security;
alter table editorial_book_metadata             enable row level security;
alter table editorial_distribution_formats      enable row level security;
alter table editorial_distribution_submissions  enable row level security;
alter table editorial_distribution_identifiers  enable row level security;
alter table editorial_distribution_artifacts    enable row level security;
alter table editorial_distribution_issues       enable row level security;
alter table editorial_distribution_events       enable row level security;
alter table editorial_distribution_jobs         enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_distribution_channels
-- ────────────────────────────────────────────────────────────────────────────

-- Any authenticated user can read the channel catalogue
drop policy if exists "anyone reads dist channels"  on editorial_distribution_channels;
create policy "anyone reads dist channels"
  on editorial_distribution_channels
  for select
  using (auth.uid() is not null);

-- Only staff can manage channels
drop policy if exists "staff manage dist channels"  on editorial_distribution_channels;
create policy "staff manage dist channels"
  on editorial_distribution_channels
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_book_metadata
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read all metadata within their org
drop policy if exists "staff read book metadata"   on editorial_book_metadata;
create policy "staff read book metadata"
  on editorial_book_metadata
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_book_metadata.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Staff can write metadata
drop policy if exists "staff write book metadata"  on editorial_book_metadata;
create policy "staff write book metadata"
  on editorial_book_metadata
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_book_metadata.project_id
        and p.org_id = public.get_my_org_id()
    )
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_book_metadata.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Project owners (authors) can read metadata for their own projects
drop policy if exists "authors read own book metadata" on editorial_book_metadata;
create policy "authors read own book metadata"
  on editorial_book_metadata
  for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_book_metadata.project_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_distribution_formats
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist formats"  on editorial_distribution_formats;
create policy "staff read dist formats"
  on editorial_distribution_formats
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_formats.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "staff write dist formats" on editorial_distribution_formats;
create policy "staff write dist formats"
  on editorial_distribution_formats
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_formats.project_id
        and p.org_id = public.get_my_org_id()
    )
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_formats.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Project owners can read format records for their projects
drop policy if exists "authors read own dist formats" on editorial_distribution_formats;
create policy "authors read own dist formats"
  on editorial_distribution_formats
  for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_formats.project_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_distribution_submissions
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read submissions"  on editorial_distribution_submissions;
create policy "staff read submissions"
  on editorial_distribution_submissions
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_submissions.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "staff write submissions" on editorial_distribution_submissions;
create policy "staff write submissions"
  on editorial_distribution_submissions
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_submissions.project_id
        and p.org_id = public.get_my_org_id()
    )
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_submissions.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Authors can read submission status for their own projects
drop policy if exists "authors read own submissions" on editorial_distribution_submissions;
create policy "authors read own submissions"
  on editorial_distribution_submissions
  for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_distribution_submissions.project_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_distribution_identifiers
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist identifiers"  on editorial_distribution_identifiers;
create policy "staff read dist identifiers"
  on editorial_distribution_identifiers
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_identifiers.submission_id
        and p.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "staff write dist identifiers" on editorial_distribution_identifiers;
create policy "staff write dist identifiers"
  on editorial_distribution_identifiers
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- Authors can read identifiers for their own projects' submissions
drop policy if exists "authors read own dist identifiers" on editorial_distribution_identifiers;
create policy "authors read own dist identifiers"
  on editorial_distribution_identifiers
  for select
  using (
    exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_identifiers.submission_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_distribution_artifacts
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist artifacts"  on editorial_distribution_artifacts;
create policy "staff read dist artifacts"
  on editorial_distribution_artifacts
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_artifacts.submission_id
        and p.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "staff write dist artifacts" on editorial_distribution_artifacts;
create policy "staff write dist artifacts"
  on editorial_distribution_artifacts
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Authors can read artifacts for their own submissions
drop policy if exists "authors read own dist artifacts" on editorial_distribution_artifacts;
create policy "authors read own dist artifacts"
  on editorial_distribution_artifacts
  for select
  using (
    exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_artifacts.submission_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_distribution_issues
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist issues"  on editorial_distribution_issues;
create policy "staff read dist issues"
  on editorial_distribution_issues
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_issues.submission_id
        and p.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "staff write dist issues" on editorial_distribution_issues;
create policy "staff write dist issues"
  on editorial_distribution_issues
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Authors can read issues for their own projects' submissions
drop policy if exists "authors read own dist issues" on editorial_distribution_issues;
create policy "authors read own dist issues"
  on editorial_distribution_issues
  for select
  using (
    exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_issues.submission_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_distribution_events (audit trail — read-only for users)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist events"  on editorial_distribution_events;
create policy "staff read dist events"
  on editorial_distribution_events
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_events.submission_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Events are written exclusively via service role; no user-facing insert policy.

-- Authors can read the event log for their own projects' submissions
drop policy if exists "authors read own dist events" on editorial_distribution_events;
create policy "authors read own dist events"
  on editorial_distribution_events
  for select
  using (
    exists (
      select 1 from editorial_distribution_submissions s
        join editorial_projects p on p.id = s.project_id
      where s.id = editorial_distribution_events.submission_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 9: editorial_distribution_jobs
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read dist jobs"  on editorial_distribution_jobs;
create policy "staff read dist jobs"
  on editorial_distribution_jobs
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_distribution_jobs.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- Job writes are service-role only (worker processes, webhooks, admin APIs).
-- No user-facing insert/update policy — intentional for security.


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
