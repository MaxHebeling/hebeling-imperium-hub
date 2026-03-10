-- =============================================================================
-- Phase 6 — Editorial AI Workspace
-- Reino Editorial AI Engine
-- =============================================================================
-- Minimal new tables to support the human-in-the-loop editing workspace.
-- All existing Phase 4A / 4B / 5A tables are reused where possible.
--
-- New tables:
--   editorial_edit_sessions       — tracks an editor's active working session
--   editorial_document_versions   — immutable snapshots of manuscript content
--   editorial_document_changes    — individual change records (AI or human)
--
-- NOT introduced (deliberately reused instead):
--   suggestion_anchors → editorial_ai_findings.location_ref
--   decisions         → editorial_ai_finding_decisions (Phase 4B)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EDITORIAL EDIT SESSIONS
-- ---------------------------------------------------------------------------
-- One row per editor session on a project+stage pair.
-- Used for presence awareness and session-scoped undo history.
-- Designed for future multi-user extension (currently single-user).

create table if not exists editorial_edit_sessions (
  id              uuid primary key default gen_random_uuid(),

  project_id      uuid not null
                    references editorial_projects(id) on delete cascade,
  stage           text not null
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  editor_id       uuid not null
                    references profiles(id) on delete cascade,

  -- Session lifecycle
  started_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  ended_at        timestamptz,

  -- Freeform metadata (client version, browser, IP for auditing)
  metadata        jsonb not null default '{}'
);

comment on table editorial_edit_sessions is
  'Tracks editor sessions within a project stage. Designed for future real-time collaboration.';

create index if not exists idx_edit_sessions_project
  on editorial_edit_sessions(project_id, stage);
create index if not exists idx_edit_sessions_editor
  on editorial_edit_sessions(editor_id);
create index if not exists idx_edit_sessions_active
  on editorial_edit_sessions(project_id, stage, ended_at)
  where ended_at is null;

-- ---------------------------------------------------------------------------
-- 2. EDITORIAL DOCUMENT VERSIONS
-- ---------------------------------------------------------------------------
-- Immutable content snapshots. A new version is created:
--   a) when the editor explicitly saves
--   b) automatically before a batch of AI changes is applied
-- Full-text content is stored in the `content` column (plain text / markdown).
-- For very large manuscripts, `content` can be replaced with a storage_path ref.

create table if not exists editorial_document_versions (
  id              uuid primary key default gen_random_uuid(),

  project_id      uuid not null
                    references editorial_projects(id) on delete cascade,
  stage           text not null
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  -- Monotonically increasing per (project, stage)
  version_number  integer not null check (version_number > 0),

  -- Full manuscript text at this point in time
  content         text not null,

  -- How this version came to be
  source          text not null default 'manual'
                    check (source in ('manual','ai_applied','import','restore')),

  -- Link back to the AI job run when source = 'ai_applied'
  job_run_id      uuid
                    references editorial_ai_job_runs(id) on delete set null,

  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),

  unique (project_id, stage, version_number)
);

comment on table editorial_document_versions is
  'Immutable content snapshots of a manuscript at a given point in time.';

create index if not exists idx_doc_versions_project
  on editorial_document_versions(project_id, stage);
create index if not exists idx_doc_versions_created
  on editorial_document_versions(project_id, stage, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. EDITORIAL DOCUMENT CHANGES
-- ---------------------------------------------------------------------------
-- Fine-grained change records. One row per accepted suggestion or manual edit.
-- Links to the source finding when change originated from AI analysis.

create table if not exists editorial_document_changes (
  id              uuid primary key default gen_random_uuid(),

  project_id      uuid not null
                    references editorial_projects(id) on delete cascade,
  stage           text not null
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  -- Version snapshots surrounding this change
  from_version_id uuid references editorial_document_versions(id) on delete set null,
  to_version_id   uuid references editorial_document_versions(id) on delete set null,

  -- Fragment-level tracking
  -- location_ref mirrors editorial_ai_findings.location_ref format
  location_ref    text,

  -- The text before and after the change
  original_text   text,
  revised_text    text,

  -- Source of the change
  change_source   text not null default 'manual'
                    check (change_source in ('manual','ai_accepted','ai_edited')),

  -- If the change came from a finding, link it
  finding_id      uuid
                    references editorial_ai_findings(id) on delete set null,

  -- The decision record that approved/triggered this change
  decision_id     uuid
                    references editorial_ai_finding_decisions(id) on delete set null,

  -- Edit session that produced this change
  session_id      uuid
                    references editorial_edit_sessions(id) on delete set null,

  applied_by      uuid references profiles(id) on delete set null,
  applied_at      timestamptz not null default now()
);

comment on table editorial_document_changes is
  'Granular change records linking original text, revised text, and source (AI finding or manual edit).';

create index if not exists idx_doc_changes_project
  on editorial_document_changes(project_id, stage);
create index if not exists idx_doc_changes_finding
  on editorial_document_changes(finding_id)
  where finding_id is not null;
create index if not exists idx_doc_changes_applied
  on editorial_document_changes(project_id, stage, applied_at desc);

-- ---------------------------------------------------------------------------
-- RLS policies (service role bypasses; user-facing reads scoped to org)
-- ---------------------------------------------------------------------------

alter table editorial_edit_sessions    enable row level security;
alter table editorial_document_versions enable row level security;
alter table editorial_document_changes  enable row level security;

-- Edit sessions: staff can read their org's sessions
create policy "staff_read_edit_sessions" on editorial_edit_sessions
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_edit_sessions.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "editor_manage_own_sessions" on editorial_edit_sessions
  for all using (editor_id = auth.uid());

-- Document versions: staff can read
create policy "staff_read_doc_versions" on editorial_document_versions
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_document_versions.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Document changes: staff can read
create policy "staff_read_doc_changes" on editorial_document_changes
  for select using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_document_changes.project_id
        and p.org_id = public.get_my_org_id()
    )
  );
