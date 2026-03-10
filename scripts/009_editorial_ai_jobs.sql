-- =============================================================
-- 009: Editorial AI Jobs System
-- =============================================================

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

do $$ begin
  create type editorial_stage_key as enum (
    'ingesta', 'estructura', 'estilo',
    'ortotipografia', 'maquetacion', 'revision_final'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_job_status as enum (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_job_run_status as enum ('started', 'success', 'failure');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_finding_type as enum (
    'grammar', 'style', 'structure', 'consistency', 'terminology', 'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_finding_severity as enum (
    'critical', 'major', 'minor', 'suggestion'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_finding_status as enum (
    'open', 'accepted', 'rejected', 'resolved'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_review_action_type as enum (
    'approve', 'reject', 'request_revision', 'escalate'
  );
exception
  when duplicate_object then null;
end $$;

-- ─── editorial_ai_jobs ────────────────────────────────────────────────────────

create table if not exists editorial_ai_jobs (
  id           uuid         primary key default gen_random_uuid(),
  project_id   uuid         not null references projects(id) on delete cascade,
  stage_key    editorial_stage_key not null,
  job_type     text         not null,
  status       ai_job_status not null default 'pending',
  triggered_by uuid         references profiles(id) on delete set null,
  metadata     jsonb,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

-- ─── editorial_ai_job_runs ────────────────────────────────────────────────────

create table if not exists editorial_ai_job_runs (
  id            uuid              primary key default gen_random_uuid(),
  job_id        uuid              not null references editorial_ai_jobs(id) on delete cascade,
  status        ai_job_run_status not null default 'started',
  started_at    timestamptz       not null default now(),
  finished_at   timestamptz,
  output        jsonb,
  error_message text,
  duration_ms   integer
);

-- ─── editorial_ai_findings ────────────────────────────────────────────────────

create table if not exists editorial_ai_findings (
  id               uuid                primary key default gen_random_uuid(),
  project_id       uuid                not null references projects(id) on delete cascade,
  stage_key        editorial_stage_key not null,
  ai_job_id        uuid                not null references editorial_ai_jobs(id) on delete cascade,
  source_file_id   uuid,
  finding_type     ai_finding_type     not null,
  severity         ai_finding_severity not null,
  title            text                not null,
  description      text                not null,
  snippet          text,
  suggested_action text                not null,
  status           ai_finding_status   not null default 'open',
  created_at       timestamptz         not null default now(),
  updated_at       timestamptz         not null default now()
);

-- ─── editorial_ai_recommendations ────────────────────────────────────────────

create table if not exists editorial_ai_recommendations (
  id         uuid                primary key default gen_random_uuid(),
  finding_id uuid                not null references editorial_ai_findings(id) on delete cascade,
  project_id uuid                not null references projects(id) on delete cascade,
  stage_key  editorial_stage_key not null,
  content    text                not null,
  rationale  text,
  priority   integer             not null default 0,
  created_at timestamptz         not null default now()
);

-- ─── editorial_ai_review_actions ─────────────────────────────────────────────

create table if not exists editorial_ai_review_actions (
  id          uuid                  primary key default gen_random_uuid(),
  finding_id  uuid                  not null references editorial_ai_findings(id) on delete cascade,
  reviewer_id uuid                  not null references profiles(id) on delete cascade,
  action_type ai_review_action_type not null,
  note        text,
  created_at  timestamptz           not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index if not exists idx_editorial_ai_jobs_project_id
  on editorial_ai_jobs(project_id);
create index if not exists idx_editorial_ai_jobs_stage_key
  on editorial_ai_jobs(stage_key);
create index if not exists idx_editorial_ai_job_runs_job_id
  on editorial_ai_job_runs(job_id);
create index if not exists idx_editorial_ai_findings_project_id
  on editorial_ai_findings(project_id);
create index if not exists idx_editorial_ai_findings_stage_key
  on editorial_ai_findings(stage_key);
create index if not exists idx_editorial_ai_findings_status
  on editorial_ai_findings(status);
create index if not exists idx_editorial_ai_findings_severity
  on editorial_ai_findings(severity);
create index if not exists idx_editorial_ai_review_actions_finding_id
  on editorial_ai_review_actions(finding_id);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_editorial_ai_jobs_updated_at on editorial_ai_jobs;
create trigger set_editorial_ai_jobs_updated_at
  before update on editorial_ai_jobs
  for each row execute function update_updated_at();

drop trigger if exists set_editorial_ai_findings_updated_at on editorial_ai_findings;
create trigger set_editorial_ai_findings_updated_at
  before update on editorial_ai_findings
  for each row execute function update_updated_at();

-- ─── ENABLE RLS ───────────────────────────────────────────────────────────────

alter table editorial_ai_jobs enable row level security;
alter table editorial_ai_job_runs enable row level security;
alter table editorial_ai_findings enable row level security;
alter table editorial_ai_recommendations enable row level security;
alter table editorial_ai_review_actions enable row level security;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────
-- Staff roles (superadmin, admin, ops) can read and write.
-- All writes go through the service role in practice (bypasses RLS),
-- but policies are defined for completeness and direct-access safety.

-- editorial_ai_jobs
drop policy if exists "staff read editorial_ai_jobs" on editorial_ai_jobs;
create policy "staff read editorial_ai_jobs"
on editorial_ai_jobs for select
using (
  exists (
    select 1 from projects p
    where p.id = editorial_ai_jobs.project_id
      and p.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff insert editorial_ai_jobs" on editorial_ai_jobs;
create policy "staff insert editorial_ai_jobs"
on editorial_ai_jobs for insert
with check (
  exists (
    select 1 from projects p
    where p.id = editorial_ai_jobs.project_id
      and p.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff update editorial_ai_jobs" on editorial_ai_jobs;
create policy "staff update editorial_ai_jobs"
on editorial_ai_jobs for update
using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- editorial_ai_job_runs
drop policy if exists "staff read editorial_ai_job_runs" on editorial_ai_job_runs;
create policy "staff read editorial_ai_job_runs"
on editorial_ai_job_runs for select
using (
  exists (
    select 1 from editorial_ai_jobs j
    where j.id = editorial_ai_job_runs.job_id
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff insert editorial_ai_job_runs" on editorial_ai_job_runs;
create policy "staff insert editorial_ai_job_runs"
on editorial_ai_job_runs for insert
with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff update editorial_ai_job_runs" on editorial_ai_job_runs;
create policy "staff update editorial_ai_job_runs"
on editorial_ai_job_runs for update
using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- editorial_ai_findings
drop policy if exists "staff read editorial_ai_findings" on editorial_ai_findings;
create policy "staff read editorial_ai_findings"
on editorial_ai_findings for select
using (
  exists (
    select 1 from projects p
    where p.id = editorial_ai_findings.project_id
      and p.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff insert editorial_ai_findings" on editorial_ai_findings;
create policy "staff insert editorial_ai_findings"
on editorial_ai_findings for insert
with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff update editorial_ai_findings" on editorial_ai_findings;
create policy "staff update editorial_ai_findings"
on editorial_ai_findings for update
using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- editorial_ai_recommendations
drop policy if exists "staff read editorial_ai_recommendations" on editorial_ai_recommendations;
create policy "staff read editorial_ai_recommendations"
on editorial_ai_recommendations for select
using (
  exists (
    select 1 from projects p
    where p.id = editorial_ai_recommendations.project_id
      and p.org_id = public.get_my_org_id()
  )
  and public.get_my_role() in ('superadmin', 'admin', 'ops')
);

drop policy if exists "staff insert editorial_ai_recommendations" on editorial_ai_recommendations;
create policy "staff insert editorial_ai_recommendations"
on editorial_ai_recommendations for insert
with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- editorial_ai_review_actions
drop policy if exists "staff read editorial_ai_review_actions" on editorial_ai_review_actions;
create policy "staff read editorial_ai_review_actions"
on editorial_ai_review_actions for select
using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "staff insert editorial_ai_review_actions" on editorial_ai_review_actions;
create policy "staff insert editorial_ai_review_actions"
on editorial_ai_review_actions for insert
with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));
