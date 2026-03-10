-- =============================================================================
-- Phase 4B — Editorial AI Automation
-- Reino Editorial AI Engine
-- =============================================================================
-- Tables: editorial_ai_prompt_templates, editorial_ai_findings,
--         editorial_ai_finding_decisions
-- =============================================================================
-- Depends on: 009_editorial_phase4a.sql
-- =============================================================================

-- ----------------------------------------
-- ENUMS
-- ----------------------------------------

do $$ begin
  create type ai_finding_severity as enum ('info', 'warning', 'error', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_finding_status as enum (
    'pending',
    'accepted',
    'rejected',
    'fixed',
    'deferred'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_decision_type as enum ('accept', 'reject', 'defer', 'escalate');
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------
-- 1) EDITORIAL AI PROMPT TEMPLATES
-- ----------------------------------------
-- Reusable prompt definitions for each stage and task type.

create table if not exists editorial_ai_prompt_templates (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,

  name            text not null,
  description     text,

  -- Target context
  stage           editorial_stage,          -- null = applicable to any stage
  finding_type    text,                     -- e.g. 'grammar', 'structure', 'style'
  task_type       text not null,            -- e.g. 'review', 'classification', 'summary'

  prompt_text     text not null,

  -- Default model settings (overridable per job)
  model           text,
  temperature     numeric(4,3) default 0.3
                    check (temperature >= 0 and temperature <= 2),
  max_tokens      int default 2000
                    check (max_tokens > 0),

  is_active       boolean not null default true,

  -- Structured schema expected in the model output
  output_schema   jsonb,

  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_ai_prompt_templates is
  'Reusable AI prompt definitions scoped to editorial stages and task types.';
comment on column editorial_ai_prompt_templates.prompt_text is
  'The active (current) prompt text. Versioned history lives in editorial_ai_prompt_versions (Phase 5).';
comment on column editorial_ai_prompt_templates.output_schema is
  'Optional JSON Schema for validating structured model output.';

create index if not exists idx_ai_prompt_templates_org    on editorial_ai_prompt_templates(org_id);
create index if not exists idx_ai_prompt_templates_stage  on editorial_ai_prompt_templates(stage);
create index if not exists idx_ai_prompt_templates_active on editorial_ai_prompt_templates(org_id, is_active);

-- ----------------------------------------
-- 2) EDITORIAL AI FINDINGS
-- ----------------------------------------
-- Issues or insights surfaced by AI during a job.

create table if not exists editorial_ai_findings (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references editorial_projects(id) on delete cascade,
  job_id              uuid references editorial_jobs(id) on delete set null,
  stage               editorial_stage not null,
  prompt_template_id  uuid references editorial_ai_prompt_templates(id) on delete set null,

  finding_type        text not null,       -- e.g. 'grammar', 'anachronism', 'style'
  severity            ai_finding_severity not null default 'info',
  title               text not null,
  description         text,

  -- Precise location within the manuscript
  location_ref        text,                -- e.g. "p.45 §3" or chunk reference

  -- Raw model output for traceability
  raw_output          jsonb,

  status              ai_finding_status not null default 'pending',

  -- Model confidence in this finding (0–1)
  confidence          numeric(5,4)
                        check (confidence >= 0 and confidence <= 1),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table editorial_ai_findings is
  'AI-generated findings (issues, suggestions) produced during editorial job runs.';
comment on column editorial_ai_findings.location_ref is
  'Human-readable reference to where in the manuscript the finding applies.';
comment on column editorial_ai_findings.confidence is
  'Model-reported confidence score in range [0, 1].';

create index if not exists idx_ai_findings_project    on editorial_ai_findings(project_id);
create index if not exists idx_ai_findings_job        on editorial_ai_findings(job_id);
create index if not exists idx_ai_findings_status     on editorial_ai_findings(status);
create index if not exists idx_ai_findings_severity   on editorial_ai_findings(severity);
create index if not exists idx_ai_findings_stage      on editorial_ai_findings(project_id, stage);

-- ----------------------------------------
-- 3) EDITORIAL AI FINDING DECISIONS
-- ----------------------------------------
-- Human editorial decisions on individual AI findings.

create table if not exists editorial_ai_finding_decisions (
  id              uuid primary key default gen_random_uuid(),
  finding_id      uuid not null references editorial_ai_findings(id) on delete cascade,

  decision        ai_decision_type not null,
  reason          text,

  decided_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table editorial_ai_finding_decisions is
  'Records human editorial decisions (accept/reject/defer/escalate) on AI findings.';

create index if not exists idx_ai_finding_decisions_finding on editorial_ai_finding_decisions(finding_id);
create index if not exists idx_ai_finding_decisions_user    on editorial_ai_finding_decisions(decided_by);

-- ----------------------------------------
-- RLS
-- ----------------------------------------

alter table editorial_ai_prompt_templates   enable row level security;
alter table editorial_ai_findings           enable row level security;
alter table editorial_ai_finding_decisions  enable row level security;

-- Prompt templates: staff within org
drop policy if exists "staff read ai_prompt_templates" on editorial_ai_prompt_templates;
create policy "staff read ai_prompt_templates"
  on editorial_ai_prompt_templates for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_prompt_templates" on editorial_ai_prompt_templates;
create policy "staff write ai_prompt_templates"
  on editorial_ai_prompt_templates for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin', 'admin')
  );

-- Findings: staff within org via project
drop policy if exists "staff read ai_findings" on editorial_ai_findings;
create policy "staff read ai_findings"
  on editorial_ai_findings for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_findings.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_findings" on editorial_ai_findings;
create policy "staff write ai_findings"
  on editorial_ai_findings for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_findings.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- Finding decisions
drop policy if exists "staff read ai_finding_decisions" on editorial_ai_finding_decisions;
create policy "staff read ai_finding_decisions"
  on editorial_ai_finding_decisions for select
  using (
    exists (
      select 1
      from editorial_ai_findings f
      join editorial_projects p on p.id = f.project_id
      where f.id = editorial_ai_finding_decisions.finding_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_finding_decisions" on editorial_ai_finding_decisions;
create policy "staff write ai_finding_decisions"
  on editorial_ai_finding_decisions for all
  using (
    exists (
      select 1
      from editorial_ai_findings f
      join editorial_projects p on p.id = f.project_id
      where f.id = editorial_ai_finding_decisions.finding_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );
