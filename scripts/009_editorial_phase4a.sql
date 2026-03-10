-- =============================================================================
-- Phase 4A — Editorial Pipeline Base
-- Reino Editorial AI Engine
-- =============================================================================
-- Tables: editorial_projects, editorial_stage_states, editorial_files,
--         editorial_jobs, editorial_comments
-- =============================================================================

-- ----------------------------------------
-- ENUMS
-- ----------------------------------------

do $$ begin
  create type editorial_stage as enum (
    'ingesta',
    'estructura',
    'estilo',
    'ortotipografia',
    'maquetacion',
    'revision_final'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_project_status as enum (
    'pending',
    'in_progress',
    'review',
    'approved',
    'rejected',
    'completed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_stage_status as enum (
    'pending',
    'in_progress',
    'review',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_job_status as enum (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------
-- 1) EDITORIAL PROJECTS
-- ----------------------------------------
-- Core entity: one row per book/manuscript being edited.

create table if not exists editorial_projects (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  brand_id        uuid references brands(id) on delete set null,
  tenant_id       uuid references tenants(id) on delete set null,

  title           text not null,
  author_name     text,
  slug            text,

  current_stage   editorial_stage not null default 'ingesta',
  status          editorial_project_status not null default 'pending',

  -- Flexible metadata (ISBN, genre, word count, etc.)
  metadata        jsonb not null default '{}',

  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (org_id, slug)
);

comment on table editorial_projects is
  'Master record for each book/manuscript moving through the editorial pipeline.';
comment on column editorial_projects.current_stage is
  'Active pipeline stage for the project.';
comment on column editorial_projects.metadata is
  'Freeform JSONB for ISBN, genre, word_count, language, etc.';

create index if not exists idx_editorial_projects_org       on editorial_projects(org_id);
create index if not exists idx_editorial_projects_status    on editorial_projects(status);
create index if not exists idx_editorial_projects_stage     on editorial_projects(current_stage);
create index if not exists idx_editorial_projects_tenant    on editorial_projects(tenant_id);

-- ----------------------------------------
-- 2) EDITORIAL STAGE STATES
-- ----------------------------------------
-- Per-project, per-stage tracking. One row per (project, stage) combination.

create table if not exists editorial_stage_states (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,
  stage           editorial_stage not null,
  status          editorial_stage_status not null default 'pending',

  assigned_to     uuid references profiles(id) on delete set null,

  started_at      timestamptz,
  completed_at    timestamptz,

  notes           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (project_id, stage)
);

comment on table editorial_stage_states is
  'Tracks the status of each pipeline stage for a given editorial project.';

create index if not exists idx_editorial_stage_states_project  on editorial_stage_states(project_id);
create index if not exists idx_editorial_stage_states_assigned on editorial_stage_states(assigned_to);

-- ----------------------------------------
-- 3) EDITORIAL FILES
-- ----------------------------------------
-- Files (manuscripts, PDFs, images) attached to a project or specific stage.

create table if not exists editorial_files (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,
  stage           editorial_stage,

  name            text not null,
  file_url        text not null,
  file_type       text,          -- MIME type
  size_bytes      bigint,

  -- Storage bucket path for direct references
  storage_path    text,

  uploaded_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table editorial_files is
  'Files (manuscripts, PDFs, images) associated with an editorial project and optional stage.';

create index if not exists idx_editorial_files_project on editorial_files(project_id);
create index if not exists idx_editorial_files_stage   on editorial_files(project_id, stage);

-- ----------------------------------------
-- 4) EDITORIAL JOBS
-- ----------------------------------------
-- Discrete work items within a stage of a project.

create table if not exists editorial_jobs (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,
  stage           editorial_stage not null,

  title           text not null,
  description     text,

  status          editorial_job_status not null default 'pending',

  assigned_to     uuid references profiles(id) on delete set null,
  created_by      uuid references profiles(id) on delete set null,

  due_date        date,

  -- Structured output produced by this job (AI or human)
  result_payload  jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_jobs is
  'Discrete editorial work items (human or AI-driven) within a project stage.';

create index if not exists idx_editorial_jobs_project  on editorial_jobs(project_id);
create index if not exists idx_editorial_jobs_stage    on editorial_jobs(project_id, stage);
create index if not exists idx_editorial_jobs_status   on editorial_jobs(status);
create index if not exists idx_editorial_jobs_assigned on editorial_jobs(assigned_to);

-- ----------------------------------------
-- 5) EDITORIAL COMMENTS
-- ----------------------------------------
-- Threaded comments on a project, stage, or specific job.

create table if not exists editorial_comments (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,
  stage           editorial_stage,
  job_id          uuid references editorial_jobs(id) on delete cascade,

  -- Optional parent for thread replies
  parent_id       uuid references editorial_comments(id) on delete cascade,

  content         text not null,
  author_id       uuid references profiles(id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_comments is
  'Threaded comments on editorial projects, stages, or jobs.';

create index if not exists idx_editorial_comments_project on editorial_comments(project_id);
create index if not exists idx_editorial_comments_job     on editorial_comments(job_id);

-- ----------------------------------------
-- RLS
-- ----------------------------------------

alter table editorial_projects    enable row level security;
alter table editorial_stage_states enable row level security;
alter table editorial_files       enable row level security;
alter table editorial_jobs        enable row level security;
alter table editorial_comments    enable row level security;

-- Staff (superadmin/admin/ops) can read within their org
drop policy if exists "staff read editorial_projects" on editorial_projects;
create policy "staff read editorial_projects"
  on editorial_projects for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write editorial_projects" on editorial_projects;
create policy "staff write editorial_projects"
  on editorial_projects for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- Stage states follow project access
drop policy if exists "staff read editorial_stage_states" on editorial_stage_states;
create policy "staff read editorial_stage_states"
  on editorial_stage_states for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_stage_states.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write editorial_stage_states" on editorial_stage_states;
create policy "staff write editorial_stage_states"
  on editorial_stage_states for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_stage_states.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff read editorial_files" on editorial_files;
create policy "staff read editorial_files"
  on editorial_files for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_files.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write editorial_files" on editorial_files;
create policy "staff write editorial_files"
  on editorial_files for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_files.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff read editorial_jobs" on editorial_jobs;
create policy "staff read editorial_jobs"
  on editorial_jobs for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_jobs.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write editorial_jobs" on editorial_jobs;
create policy "staff write editorial_jobs"
  on editorial_jobs for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_jobs.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff read editorial_comments" on editorial_comments;
create policy "staff read editorial_comments"
  on editorial_comments for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_comments.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write editorial_comments" on editorial_comments;
create policy "staff write editorial_comments"
  on editorial_comments for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_comments.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );
