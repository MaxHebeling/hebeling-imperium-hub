-- =============================================================================
-- Phase 5 — Editorial AI Quality & Governance
-- Reino Editorial AI Engine
-- =============================================================================
-- New tables:
--   editorial_ai_policies
--   editorial_ai_model_configs
--   editorial_ai_stage_model_rules
--   editorial_ai_prompt_versions
--   editorial_ai_job_runs
--   editorial_ai_quality_checks
--   editorial_ai_quality_scores
--   editorial_ai_finding_feedback
--   editorial_ai_audit_events
--   editorial_ai_review_queues
--   editorial_ai_queue_items
-- =============================================================================
-- Depends on: 009_editorial_phase4a.sql, 010_editorial_phase4b.sql
-- =============================================================================

-- ----------------------------------------
-- ENUMS
-- ----------------------------------------

do $$ begin
  create type ai_policy_type as enum (
    'block',
    'warn',
    'require_approval',
    'auto_accept',
    'flag_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_prompt_version_status as enum (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'deprecated'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_job_run_status as enum (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_quality_check_status as enum (
    'pending',
    'passed',
    'failed',
    'warning',
    'skipped'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_feedback_type as enum (
    'helpful',
    'not_helpful',
    'false_positive',
    'needs_improvement',
    'correct'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_audit_actor_type as enum ('user', 'system', 'ai');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_queue_item_priority as enum ('low', 'normal', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_queue_item_status as enum (
    'pending',
    'in_progress',
    'completed',
    'skipped',
    'escalated'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ai_queue_type as enum (
    'finding_review',
    'prompt_approval',
    'quality_review',
    'policy_exception'
  );
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- 1) EDITORIAL AI POLICIES
-- ============================================================
-- Institutional rules governing AI behaviour per stage, finding
-- type, or severity level.

create table if not exists editorial_ai_policies (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organizations(id) on delete cascade,

  name                  text not null,
  description           text,

  -- Scope: null = applies to all values of that dimension
  applies_to_stage      editorial_stage,
  applies_to_finding_type text,
  applies_to_severity   ai_finding_severity,

  policy_type           ai_policy_type not null,

  -- Optional structured conditions and action overrides
  conditions            jsonb not null default '{}',
  actions               jsonb not null default '{}',

  is_active             boolean not null default true,

  -- Lower number = higher priority when multiple policies match
  priority              int not null default 100
                          check (priority >= 0),

  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table editorial_ai_policies is
  'Institutional governance rules applied to AI findings based on stage, type, or severity.';
comment on column editorial_ai_policies.conditions is
  'Optional JSONB with additional match conditions (e.g. confidence thresholds).';
comment on column editorial_ai_policies.actions is
  'Optional JSONB overriding default actions for the policy_type.';
comment on column editorial_ai_policies.priority is
  'Evaluation order — lower value = evaluated first; 0 = highest priority.';

create index if not exists idx_ai_policies_org      on editorial_ai_policies(org_id);
create index if not exists idx_ai_policies_active   on editorial_ai_policies(org_id, is_active);
create index if not exists idx_ai_policies_stage    on editorial_ai_policies(applies_to_stage);
create index if not exists idx_ai_policies_priority on editorial_ai_policies(org_id, priority);

-- ============================================================
-- 2) EDITORIAL AI MODEL CONFIGS
-- ============================================================
-- Catalogue of approved AI models usable within the system.

create table if not exists editorial_ai_model_configs (
  id                          uuid primary key default gen_random_uuid(),
  org_id                      uuid not null references organizations(id) on delete cascade,

  -- Canonical model identifier (e.g. 'gpt-4o', 'claude-3-5-sonnet-20241022')
  model_id                    text not null,
  provider                    text not null,       -- e.g. 'openai', 'anthropic', 'google'
  display_name                text not null,
  description                 text,

  -- Capability tags (e.g. ['grammar_check', 'summarization', 'classification'])
  capabilities                jsonb not null default '[]',

  default_temperature         numeric(4,3) default 0.3
                                check (default_temperature >= 0 and default_temperature <= 2),
  default_max_tokens          int default 2000
                                check (default_max_tokens > 0),

  -- Cost accounting
  cost_per_1k_input_tokens    numeric(10,6) default 0,
  cost_per_1k_output_tokens   numeric(10,6) default 0,

  -- Maximum context window (tokens)
  context_window_tokens       int,

  is_active                   boolean not null default true,

  -- Provider-specific metadata (API version, region, etc.)
  metadata                    jsonb not null default '{}',

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (org_id, model_id)
);

comment on table editorial_ai_model_configs is
  'Catalogue of approved AI model configurations available to the editorial pipeline.';
comment on column editorial_ai_model_configs.capabilities is
  'JSONB array of capability tags, e.g. ["grammar_check","summarization"].';
comment on column editorial_ai_model_configs.cost_per_1k_input_tokens is
  'USD cost per 1 000 input tokens for cost accounting.';

create index if not exists idx_ai_model_configs_org      on editorial_ai_model_configs(org_id);
create index if not exists idx_ai_model_configs_active   on editorial_ai_model_configs(org_id, is_active);
create index if not exists idx_ai_model_configs_provider on editorial_ai_model_configs(provider);

-- ============================================================
-- 3) EDITORIAL AI STAGE MODEL RULES
-- ============================================================
-- Which model and prompt template to use for each stage and task type.

create table if not exists editorial_ai_stage_model_rules (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,

  stage               editorial_stage not null,
  task_type           text not null,             -- must match editorial_ai_prompt_templates.task_type

  model_config_id     uuid not null references editorial_ai_model_configs(id) on delete restrict,
  prompt_template_id  uuid references editorial_ai_prompt_templates(id) on delete set null,

  -- When true, this is the rule selected automatically unless overridden
  is_default          boolean not null default false,

  -- Lower value = higher evaluation priority
  priority            int not null default 100
                        check (priority >= 0),

  -- Extra constraints forwarded to the runner (temperature overrides, etc.)
  constraints         jsonb not null default '{}',

  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table editorial_ai_stage_model_rules is
  'Maps each editorial stage + task type to the approved model and prompt template.';
comment on column editorial_ai_stage_model_rules.constraints is
  'Per-rule overrides for temperature, max_tokens, stop sequences, etc.';

create index if not exists idx_ai_stage_model_rules_org   on editorial_ai_stage_model_rules(org_id);
create index if not exists idx_ai_stage_model_rules_stage on editorial_ai_stage_model_rules(stage, task_type);

-- ============================================================
-- 4) EDITORIAL AI PROMPT VERSIONS
-- ============================================================
-- Approval-gated version history for every prompt template.

create table if not exists editorial_ai_prompt_versions (
  id                  uuid primary key default gen_random_uuid(),
  prompt_template_id  uuid not null references editorial_ai_prompt_templates(id) on delete cascade,

  -- Monotonically increasing within a template
  version_number      int not null check (version_number > 0),

  prompt_text         text not null,
  change_summary      text,

  status              ai_prompt_version_status not null default 'draft',

  submitted_by        uuid references profiles(id) on delete set null,

  reviewed_by         uuid references profiles(id) on delete set null,
  reviewed_at         timestamptz,
  review_notes        text,

  -- True for the version currently used in production
  is_current          boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (prompt_template_id, version_number)
);

comment on table editorial_ai_prompt_versions is
  'Versioned, approval-gated history of editorial AI prompt text.';
comment on column editorial_ai_prompt_versions.is_current is
  'Only one version per template should have is_current = true.';

create index if not exists idx_ai_prompt_versions_template on editorial_ai_prompt_versions(prompt_template_id);
create index if not exists idx_ai_prompt_versions_status   on editorial_ai_prompt_versions(status);
create index if not exists idx_ai_prompt_versions_current  on editorial_ai_prompt_versions(prompt_template_id, is_current);

-- ============================================================
-- 5) EDITORIAL AI JOB RUNS
-- ============================================================
-- Technical audit record of every AI model invocation.

create table if not exists editorial_ai_job_runs (
  id                  uuid primary key default gen_random_uuid(),

  -- Context references
  job_id              uuid references editorial_jobs(id) on delete set null,
  project_id          uuid not null references editorial_projects(id) on delete cascade,
  stage               editorial_stage not null,

  -- Config references
  prompt_template_id  uuid references editorial_ai_prompt_templates(id) on delete set null,
  prompt_version_id   uuid references editorial_ai_prompt_versions(id) on delete set null,
  model_config_id     uuid references editorial_ai_model_configs(id) on delete set null,

  -- Token usage
  input_tokens        int default 0 check (input_tokens >= 0),
  output_tokens       int default 0 check (output_tokens >= 0),
  cost_usd            numeric(12,6) default 0 check (cost_usd >= 0),

  -- Timing
  duration_ms         int check (duration_ms >= 0),

  status              ai_job_run_status not null default 'pending',

  -- Full input sent to the model
  input_payload       jsonb,
  -- Full output received from the model
  output_payload      jsonb,

  error_message       text,

  initiated_by        uuid references profiles(id) on delete set null,

  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

comment on table editorial_ai_job_runs is
  'Technical audit log of every AI model invocation within the editorial pipeline.';
comment on column editorial_ai_job_runs.input_payload is
  'Full request payload sent to the model (may include system prompt, messages, etc.).';
comment on column editorial_ai_job_runs.output_payload is
  'Full raw response received from the model.';

create index if not exists idx_ai_job_runs_project   on editorial_ai_job_runs(project_id);
create index if not exists idx_ai_job_runs_job        on editorial_ai_job_runs(job_id);
create index if not exists idx_ai_job_runs_status     on editorial_ai_job_runs(status);
create index if not exists idx_ai_job_runs_stage      on editorial_ai_job_runs(project_id, stage);
create index if not exists idx_ai_job_runs_model      on editorial_ai_job_runs(model_config_id);
create index if not exists idx_ai_job_runs_created    on editorial_ai_job_runs(created_at desc);

-- ============================================================
-- 6) EDITORIAL AI QUALITY CHECKS
-- ============================================================
-- Automated quality gates run per stage or per job run.

create table if not exists editorial_ai_quality_checks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,
  job_run_id      uuid references editorial_ai_job_runs(id) on delete set null,
  stage           editorial_stage not null,

  -- Category of check, e.g. 'grammar', 'structure', 'style', 'consistency'
  check_type      text not null,
  check_name      text not null,

  status          ai_quality_check_status not null default 'pending',

  -- Normalised score 0–100
  score           numeric(5,2) check (score >= 0 and score <= 100),

  -- Structured details / evidence
  details         jsonb not null default '{}',

  -- True when the system automatically resolved the issue
  auto_resolved   boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_ai_quality_checks is
  'Automated quality gate results per editorial stage or AI job run.';
comment on column editorial_ai_quality_checks.score is
  'Normalised quality score in range [0, 100].';
comment on column editorial_ai_quality_checks.details is
  'Structured JSONB with check evidence, sub-scores, or actionable suggestions.';

create index if not exists idx_ai_quality_checks_project  on editorial_ai_quality_checks(project_id);
create index if not exists idx_ai_quality_checks_stage    on editorial_ai_quality_checks(project_id, stage);
create index if not exists idx_ai_quality_checks_run      on editorial_ai_quality_checks(job_run_id);
create index if not exists idx_ai_quality_checks_status   on editorial_ai_quality_checks(status);

-- ============================================================
-- 7) EDITORIAL AI QUALITY SCORES
-- ============================================================
-- Aggregated, time-stamped quality scores per project and stage.

create table if not exists editorial_ai_quality_scores (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references editorial_projects(id) on delete cascade,

  -- null stage = project-level aggregate
  stage           editorial_stage,

  -- e.g. 'overall', 'grammar', 'style', 'structure', 'ai_confidence'
  score_type      text not null,

  -- Normalised score 0–100
  score           numeric(5,2) not null check (score >= 0 and score <= 100),

  -- Relative weight used when computing parent aggregates
  weight          numeric(5,4) not null default 1.0 check (weight > 0),

  computed_at     timestamptz not null default now(),

  -- Supporting metadata (component scores, sample size, etc.)
  metadata        jsonb not null default '{}',

  created_at      timestamptz not null default now()
);

comment on table editorial_ai_quality_scores is
  'Time-series of aggregated quality scores per project, stage, and score type.';
comment on column editorial_ai_quality_scores.stage is
  'NULL indicates a project-level aggregate across all stages.';
comment on column editorial_ai_quality_scores.weight is
  'Relative weight for this score type when computing cross-type aggregates.';

create index if not exists idx_ai_quality_scores_project  on editorial_ai_quality_scores(project_id);
create index if not exists idx_ai_quality_scores_stage    on editorial_ai_quality_scores(project_id, stage);
create index if not exists idx_ai_quality_scores_type     on editorial_ai_quality_scores(score_type);
create index if not exists idx_ai_quality_scores_time     on editorial_ai_quality_scores(computed_at desc);

-- ============================================================
-- 8) EDITORIAL AI FINDING FEEDBACK
-- ============================================================
-- Structured human feedback on individual AI findings, used to
-- improve model and prompt quality over time.

create table if not exists editorial_ai_finding_feedback (
  id              uuid primary key default gen_random_uuid(),
  finding_id      uuid not null references editorial_ai_findings(id) on delete cascade,

  feedback_type   ai_feedback_type not null,
  comment         text,

  -- 1 = very poor, 5 = excellent
  rating          int check (rating >= 1 and rating <= 5),

  submitted_by    uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table editorial_ai_finding_feedback is
  'Human quality feedback on AI findings, used for model and prompt improvement loops.';
comment on column editorial_ai_finding_feedback.rating is
  'Optional 1–5 star rating of the finding quality.';

create index if not exists idx_ai_finding_feedback_finding on editorial_ai_finding_feedback(finding_id);
create index if not exists idx_ai_finding_feedback_user    on editorial_ai_finding_feedback(submitted_by);
create index if not exists idx_ai_finding_feedback_type   on editorial_ai_finding_feedback(feedback_type);

-- ============================================================
-- 9) EDITORIAL AI AUDIT EVENTS
-- ============================================================
-- Immutable, append-only audit log for all material AI actions.

create table if not exists editorial_ai_audit_events (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,

  -- The type of object the event refers to
  entity_type     text not null,     -- e.g. 'project', 'finding', 'prompt_version', 'policy'
  entity_id       uuid not null,

  -- The action taken
  action          text not null,     -- e.g. 'created', 'approved', 'rejected', 'run_started'

  actor_id        uuid references profiles(id) on delete set null,
  actor_type      ai_audit_actor_type not null default 'system',

  previous_state  jsonb,
  new_state       jsonb,

  -- Extra context (request ID, IP, etc.)
  metadata        jsonb not null default '{}',

  created_at      timestamptz not null default now()
);

comment on table editorial_ai_audit_events is
  'Immutable audit trail of all material AI-related actions in the editorial pipeline.';
comment on column editorial_ai_audit_events.entity_type is
  'Type discriminator: project | job | finding | prompt_template | prompt_version | policy | model_config | job_run | quality_check.';
comment on column editorial_ai_audit_events.previous_state is
  'Snapshot of the entity before the action (may be null for create events).';
comment on column editorial_ai_audit_events.new_state is
  'Snapshot of the entity after the action.';

create index if not exists idx_ai_audit_events_org        on editorial_ai_audit_events(org_id);
create index if not exists idx_ai_audit_events_entity     on editorial_ai_audit_events(entity_type, entity_id);
create index if not exists idx_ai_audit_events_actor      on editorial_ai_audit_events(actor_id);
create index if not exists idx_ai_audit_events_created    on editorial_ai_audit_events(created_at desc);

-- ============================================================
-- 10) EDITORIAL AI REVIEW QUEUES
-- ============================================================
-- Named queues routing items to appropriate reviewers.

create table if not exists editorial_ai_review_queues (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,

  name            text not null,
  description     text,

  queue_type      ai_queue_type not null,

  -- Optional stage filter (null = queue accepts items from any stage)
  stage           editorial_stage,

  -- Role allowed to process items in this queue
  assigned_role   app_role,

  -- Optional default assignee
  auto_assign_to  uuid references profiles(id) on delete set null,

  is_active       boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_ai_review_queues is
  'Named review queues routing editorial AI items to the right human reviewers.';
comment on column editorial_ai_review_queues.queue_type is
  'Determines what kind of items are placed in this queue.';
comment on column editorial_ai_review_queues.assigned_role is
  'Minimum role required to process items; null = any authenticated staff.';

create index if not exists idx_ai_review_queues_org    on editorial_ai_review_queues(org_id);
create index if not exists idx_ai_review_queues_type   on editorial_ai_review_queues(queue_type);
create index if not exists idx_ai_review_queues_active on editorial_ai_review_queues(org_id, is_active);

-- ============================================================
-- 11) EDITORIAL AI QUEUE ITEMS
-- ============================================================
-- Individual items placed in a review queue for human action.

create table if not exists editorial_ai_queue_items (
  id              uuid primary key default gen_random_uuid(),
  queue_id        uuid not null references editorial_ai_review_queues(id) on delete cascade,

  -- What object this item is about
  entity_type     text not null,
  entity_id       uuid not null,

  -- Convenience denormalisation for filtering without joins
  project_id      uuid references editorial_projects(id) on delete cascade,

  priority        ai_queue_item_priority not null default 'normal',
  status          ai_queue_item_status not null default 'pending',

  assigned_to     uuid references profiles(id) on delete set null,

  -- Optional deadline for SLA enforcement
  due_at          timestamptz,

  -- Supporting context surfaced to the reviewer
  context         jsonb not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  completed_at    timestamptz,
  completed_by    uuid references profiles(id) on delete set null
);

comment on table editorial_ai_queue_items is
  'Individual items awaiting human review in an editorial AI review queue.';
comment on column editorial_ai_queue_items.entity_type is
  'Discriminator matching editorial_ai_audit_events.entity_type.';
comment on column editorial_ai_queue_items.context is
  'Structured JSONB surfaced to the reviewer (excerpt, finding summary, etc.).';

create index if not exists idx_ai_queue_items_queue    on editorial_ai_queue_items(queue_id);
create index if not exists idx_ai_queue_items_status   on editorial_ai_queue_items(queue_id, status);
create index if not exists idx_ai_queue_items_project  on editorial_ai_queue_items(project_id);
create index if not exists idx_ai_queue_items_assigned on editorial_ai_queue_items(assigned_to);
create index if not exists idx_ai_queue_items_priority on editorial_ai_queue_items(queue_id, priority, created_at);

-- ============================================================
-- RLS — Phase 5 Tables
-- ============================================================

alter table editorial_ai_policies           enable row level security;
alter table editorial_ai_model_configs      enable row level security;
alter table editorial_ai_stage_model_rules  enable row level security;
alter table editorial_ai_prompt_versions    enable row level security;
alter table editorial_ai_job_runs           enable row level security;
alter table editorial_ai_quality_checks     enable row level security;
alter table editorial_ai_quality_scores     enable row level security;
alter table editorial_ai_finding_feedback   enable row level security;
alter table editorial_ai_audit_events       enable row level security;
alter table editorial_ai_review_queues      enable row level security;
alter table editorial_ai_queue_items        enable row level security;

-- ---- Policies ----
drop policy if exists "staff read ai_policies" on editorial_ai_policies;
create policy "staff read ai_policies"
  on editorial_ai_policies for select
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write ai_policies" on editorial_ai_policies;
create policy "admin write ai_policies"
  on editorial_ai_policies for all
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin'));

-- ---- Model configs ----
drop policy if exists "staff read ai_model_configs" on editorial_ai_model_configs;
create policy "staff read ai_model_configs"
  on editorial_ai_model_configs for select
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write ai_model_configs" on editorial_ai_model_configs;
create policy "admin write ai_model_configs"
  on editorial_ai_model_configs for all
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin'));

-- ---- Stage model rules ----
drop policy if exists "staff read ai_stage_model_rules" on editorial_ai_stage_model_rules;
create policy "staff read ai_stage_model_rules"
  on editorial_ai_stage_model_rules for select
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write ai_stage_model_rules" on editorial_ai_stage_model_rules;
create policy "admin write ai_stage_model_rules"
  on editorial_ai_stage_model_rules for all
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin'));

-- ---- Prompt versions ----
drop policy if exists "staff read ai_prompt_versions" on editorial_ai_prompt_versions;
create policy "staff read ai_prompt_versions"
  on editorial_ai_prompt_versions for select
  using (
    exists (
      select 1 from editorial_ai_prompt_templates t
      where t.id = editorial_ai_prompt_versions.prompt_template_id
        and t.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_prompt_versions" on editorial_ai_prompt_versions;
create policy "staff write ai_prompt_versions"
  on editorial_ai_prompt_versions for all
  using (
    exists (
      select 1 from editorial_ai_prompt_templates t
      where t.id = editorial_ai_prompt_versions.prompt_template_id
        and t.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin')
  );

-- ---- Job runs ----
drop policy if exists "staff read ai_job_runs" on editorial_ai_job_runs;
create policy "staff read ai_job_runs"
  on editorial_ai_job_runs for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_job_runs.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_job_runs" on editorial_ai_job_runs;
create policy "staff write ai_job_runs"
  on editorial_ai_job_runs for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_job_runs.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- ---- Quality checks ----
drop policy if exists "staff read ai_quality_checks" on editorial_ai_quality_checks;
create policy "staff read ai_quality_checks"
  on editorial_ai_quality_checks for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_quality_checks.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_quality_checks" on editorial_ai_quality_checks;
create policy "staff write ai_quality_checks"
  on editorial_ai_quality_checks for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_quality_checks.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- ---- Quality scores ----
drop policy if exists "staff read ai_quality_scores" on editorial_ai_quality_scores;
create policy "staff read ai_quality_scores"
  on editorial_ai_quality_scores for select
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_quality_scores.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_quality_scores" on editorial_ai_quality_scores;
create policy "staff write ai_quality_scores"
  on editorial_ai_quality_scores for all
  using (
    exists (
      select 1 from editorial_projects p
      where p.id = editorial_ai_quality_scores.project_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- ---- Finding feedback ----
drop policy if exists "staff read ai_finding_feedback" on editorial_ai_finding_feedback;
create policy "staff read ai_finding_feedback"
  on editorial_ai_finding_feedback for select
  using (
    exists (
      select 1
      from editorial_ai_findings f
      join editorial_projects p on p.id = f.project_id
      where f.id = editorial_ai_finding_feedback.finding_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_finding_feedback" on editorial_ai_finding_feedback;
create policy "staff write ai_finding_feedback"
  on editorial_ai_finding_feedback for all
  using (
    exists (
      select 1
      from editorial_ai_findings f
      join editorial_projects p on p.id = f.project_id
      where f.id = editorial_ai_finding_feedback.finding_id
        and p.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- ---- Audit events (read-only via RLS; writes via service role only) ----
drop policy if exists "staff read ai_audit_events" on editorial_ai_audit_events;
create policy "staff read ai_audit_events"
  on editorial_ai_audit_events for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin', 'admin')
  );

-- ---- Review queues ----
drop policy if exists "staff read ai_review_queues" on editorial_ai_review_queues;
create policy "staff read ai_review_queues"
  on editorial_ai_review_queues for select
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write ai_review_queues" on editorial_ai_review_queues;
create policy "admin write ai_review_queues"
  on editorial_ai_review_queues for all
  using (org_id = public.get_my_org_id() and public.get_my_role() in ('superadmin', 'admin'));

-- ---- Queue items ----
drop policy if exists "staff read ai_queue_items" on editorial_ai_queue_items;
create policy "staff read ai_queue_items"
  on editorial_ai_queue_items for select
  using (
    exists (
      select 1 from editorial_ai_review_queues q
      where q.id = editorial_ai_queue_items.queue_id
        and q.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

drop policy if exists "staff write ai_queue_items" on editorial_ai_queue_items;
create policy "staff write ai_queue_items"
  on editorial_ai_queue_items for all
  using (
    exists (
      select 1 from editorial_ai_review_queues q
      where q.id = editorial_ai_queue_items.queue_id
        and q.org_id = public.get_my_org_id()
    )
    and public.get_my_role() in ('superadmin', 'admin', 'ops')
  );
