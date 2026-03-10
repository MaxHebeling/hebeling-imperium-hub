-- =============================================================================
-- Phase 5 — Editorial AI Quality & Governance
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- 11 new tables (text + CHECK constraints; no DO/EXCEPTION enum blocks):
--
--   1.  editorial_ai_policies
--   2.  editorial_ai_model_configs
--   3.  editorial_ai_stage_model_rules
--   4.  editorial_ai_prompt_versions      ← distinct from editorial_ai_prompt_templates
--   5.  editorial_ai_job_runs             ← distinct from editorial_jobs
--   6.  editorial_ai_quality_checks       ← per-run automated gates
--   7.  editorial_ai_quality_scores       ← aggregated time-series scores
--   8.  editorial_ai_finding_feedback
--   9.  editorial_ai_audit_events
--   10. editorial_ai_review_queues
--   11. editorial_ai_queue_items
--
-- Depends on: 009_editorial_phase4a.sql, 010_editorial_phase4b.sql
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL AI POLICIES
-- ============================================================
-- Institutional governance rules that control AI behaviour at the
-- stage, finding-type, or severity level.
-- ============================================================

create table if not exists editorial_ai_policies (
  id                      uuid        primary key default gen_random_uuid(),
  org_id                  uuid        not null references organizations(id) on delete cascade,

  name                    text        not null,
  description             text,

  -- Scope selectors (null = match any value for that dimension)
  applies_to_stage        text
                            check (applies_to_stage in (
                              'ingesta','estructura','estilo',
                              'ortotipografia','maquetacion','revision_final'
                            )),
  applies_to_finding_type text,
  applies_to_severity     text
                            check (applies_to_severity in ('info','warning','error','critical')),

  -- What the system does when the policy matches
  policy_type             text        not null
                            check (policy_type in (
                              'block','warn','require_approval','auto_accept','flag_review'
                            )),

  -- Additional match conditions (e.g. confidence_lt: 0.6)
  conditions              jsonb       not null default '{}',
  -- Overrides for the default behaviour of the policy_type
  actions                 jsonb       not null default '{}',

  is_active               boolean     not null default true,

  -- Evaluation order: lower value = evaluated first; 0 = highest priority
  priority                integer     not null default 100
                            check (priority >= 0),

  created_by              uuid        references profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table editorial_ai_policies is
  'Institutional governance rules applied to AI findings based on stage, finding type, or severity. Lower priority value = evaluated first.';
comment on column editorial_ai_policies.applies_to_stage is
  'NULL matches all pipeline stages.';
comment on column editorial_ai_policies.applies_to_severity is
  'NULL matches all severity levels.';
comment on column editorial_ai_policies.conditions is
  'JSONB with extra match predicates, e.g. {"confidence_lt": 0.6}.';
comment on column editorial_ai_policies.actions is
  'JSONB override for the default actions of this policy_type.';
comment on column editorial_ai_policies.priority is
  'Lower = evaluated first; 0 is the highest possible priority.';

create index if not exists idx_ai_policies_org_active
  on editorial_ai_policies(org_id, is_active);
create index if not exists idx_ai_policies_priority
  on editorial_ai_policies(org_id, priority asc);
create index if not exists idx_ai_policies_stage
  on editorial_ai_policies(applies_to_stage)
  where applies_to_stage is not null;


-- ============================================================
-- 2. EDITORIAL AI MODEL CONFIGS
-- ============================================================
-- Catalogue of AI models approved for use within the pipeline.
-- One row per (org, model_id) — orgs maintain their own catalogue.
-- ============================================================

create table if not exists editorial_ai_model_configs (
  id                        uuid        primary key default gen_random_uuid(),
  org_id                    uuid        not null references organizations(id) on delete cascade,

  -- Canonical provider model slug, e.g. 'gpt-4o', 'claude-3-5-sonnet-20241022'
  model_id                  text        not null,
  provider                  text        not null
                              check (provider in ('openai','anthropic','google','mistral','other')),
  display_name              text        not null,
  description               text,

  -- Capability tags as a JSONB array, e.g. ["grammar_check","summarization"]
  capabilities              jsonb       not null default '[]',

  default_temperature       numeric(4,3) default 0.3
                              check (default_temperature >= 0 and default_temperature <= 2),
  default_max_tokens        integer     default 2000
                              check (default_max_tokens > 0),

  -- Context window size in tokens (informational, used in capacity planning)
  context_window_tokens     integer     check (context_window_tokens > 0),

  -- Cost accounting in USD
  cost_per_1k_input_tokens  numeric(10,6) not null default 0
                              check (cost_per_1k_input_tokens >= 0),
  cost_per_1k_output_tokens numeric(10,6) not null default 0
                              check (cost_per_1k_output_tokens >= 0),

  is_active                 boolean     not null default true,

  -- Provider-specific metadata (API version, region, tier, etc.)
  metadata                  jsonb       not null default '{}',

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (org_id, model_id)
);

comment on table editorial_ai_model_configs is
  'Catalogue of approved AI model configurations available to the editorial pipeline.';
comment on column editorial_ai_model_configs.model_id is
  'Canonical provider slug, e.g. ''gpt-4o'', ''claude-3-5-sonnet-20241022''.';
comment on column editorial_ai_model_configs.capabilities is
  'JSONB array of capability tags such as ["grammar_check","summarization","classification"].';
comment on column editorial_ai_model_configs.cost_per_1k_input_tokens is
  'USD cost per 1 000 input tokens; used for job-run cost accounting.';
comment on column editorial_ai_model_configs.metadata is
  'Provider-specific configuration: API version, deployment region, tier, etc.';

create index if not exists idx_ai_model_configs_org_active
  on editorial_ai_model_configs(org_id, is_active);
create index if not exists idx_ai_model_configs_provider
  on editorial_ai_model_configs(provider);


-- ============================================================
-- 3. EDITORIAL AI STAGE MODEL RULES
-- ============================================================
-- Assigns which AI model (and optionally which prompt template)
-- to use for a given pipeline stage + task type combination.
-- Distinct from editorial_jobs: this is configuration, not execution.
-- ============================================================

create table if not exists editorial_ai_stage_model_rules (
  id                  uuid        primary key default gen_random_uuid(),
  org_id              uuid        not null references organizations(id) on delete cascade,

  stage               text        not null
                        check (stage in (
                          'ingesta','estructura','estilo',
                          'ortotipografia','maquetacion','revision_final'
                        )),
  -- Must match editorial_ai_prompt_templates.task_type
  task_type           text        not null,

  model_config_id     uuid        not null
                        references editorial_ai_model_configs(id) on delete restrict,
  prompt_template_id  uuid
                        references editorial_ai_prompt_templates(id) on delete set null,

  -- True = selected automatically when no explicit override is provided
  is_default          boolean     not null default false,

  -- Lower value = higher evaluation priority when multiple rules match
  priority            integer     not null default 100
                        check (priority >= 0),

  -- Runner-level overrides: temperature, max_tokens, stop sequences, etc.
  constraints         jsonb       not null default '{}',

  created_by          uuid        references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table editorial_ai_stage_model_rules is
  'Maps each editorial stage + task type to an approved model and optional prompt template. Configuration layer — not execution records.';
comment on column editorial_ai_stage_model_rules.task_type is
  'Must match the task_type value in editorial_ai_prompt_templates.';
comment on column editorial_ai_stage_model_rules.is_default is
  'When true, this rule is selected automatically if no override exists.';
comment on column editorial_ai_stage_model_rules.constraints is
  'Per-rule runner overrides such as {"temperature": 0.1, "max_tokens": 1000}.';

create index if not exists idx_ai_stage_model_rules_org
  on editorial_ai_stage_model_rules(org_id);
create index if not exists idx_ai_stage_model_rules_lookup
  on editorial_ai_stage_model_rules(org_id, stage, task_type, priority asc);


-- ============================================================
-- 4. EDITORIAL AI PROMPT VERSIONS
-- ============================================================
-- Approval-gated version history for editorial_ai_prompt_templates.
-- Distinct from the templates table: templates hold active config;
-- versions hold the full text history with review audit trail.
-- ============================================================

create table if not exists editorial_ai_prompt_versions (
  id                  uuid        primary key default gen_random_uuid(),
  prompt_template_id  uuid        not null
                        references editorial_ai_prompt_templates(id) on delete cascade,

  -- Monotonically increasing per template; assigned at insert time
  version_number      integer     not null
                        check (version_number > 0),

  prompt_text         text        not null,
  change_summary      text,

  status              text        not null default 'draft'
                        check (status in (
                          'draft','pending_approval','approved','rejected','deprecated'
                        )),

  submitted_by        uuid        references profiles(id) on delete set null,

  reviewed_by         uuid        references profiles(id) on delete set null,
  reviewed_at         timestamptz,
  review_notes        text,

  -- Exactly one version per template should have is_current = true at any time
  is_current          boolean     not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (prompt_template_id, version_number)
);

comment on table editorial_ai_prompt_versions is
  'Versioned, approval-gated text history for editorial AI prompt templates. Separate from the template record so the template always reflects active config.';
comment on column editorial_ai_prompt_versions.version_number is
  'Monotonically increasing integer within a template; assigned by the application layer.';
comment on column editorial_ai_prompt_versions.status is
  'Lifecycle: draft → pending_approval → approved (promoted to is_current) or rejected. Superseded versions become deprecated.';
comment on column editorial_ai_prompt_versions.is_current is
  'True for the single version currently active in production. Enforced by application logic.';
comment on column editorial_ai_prompt_versions.review_notes is
  'Reviewer feedback when approving or rejecting a version.';

create index if not exists idx_ai_prompt_versions_template
  on editorial_ai_prompt_versions(prompt_template_id);
create index if not exists idx_ai_prompt_versions_status
  on editorial_ai_prompt_versions(status);
create index if not exists idx_ai_prompt_versions_current
  on editorial_ai_prompt_versions(prompt_template_id, is_current)
  where is_current = true;


-- ============================================================
-- 5. EDITORIAL AI JOB RUNS
-- ============================================================
-- Technical execution record of every AI model invocation.
-- Distinct from editorial_jobs (Phase 4A): editorial_jobs are
-- human-assigned work items; editorial_ai_job_runs are the
-- low-level AI calls made during those (or independent) jobs.
-- ============================================================

create table if not exists editorial_ai_job_runs (
  id                  uuid        primary key default gen_random_uuid(),

  -- Optional link to the editorial_job that triggered this run
  job_id              uuid        references editorial_jobs(id) on delete set null,
  project_id          uuid        not null
                        references editorial_projects(id) on delete cascade,
  stage               text        not null
                        check (stage in (
                          'ingesta','estructura','estilo',
                          'ortotipografia','maquetacion','revision_final'
                        )),

  -- Configuration snapshot at execution time
  prompt_template_id  uuid        references editorial_ai_prompt_templates(id) on delete set null,
  prompt_version_id   uuid        references editorial_ai_prompt_versions(id) on delete set null,
  model_config_id     uuid        references editorial_ai_model_configs(id) on delete set null,

  -- Token usage and cost
  input_tokens        integer     not null default 0 check (input_tokens >= 0),
  output_tokens       integer     not null default 0 check (output_tokens >= 0),
  cost_usd            numeric(12,6) not null default 0 check (cost_usd >= 0),

  -- Wall-clock execution time in milliseconds
  duration_ms         integer     check (duration_ms >= 0),

  status              text        not null default 'pending'
                        check (status in ('pending','running','completed','failed','cancelled')),

  -- Full request/response payloads for traceability and debugging
  input_payload       jsonb,
  output_payload      jsonb,
  error_message       text,

  initiated_by        uuid        references profiles(id) on delete set null,

  created_at          timestamptz not null default now(),
  -- Set when status transitions to completed, failed, or cancelled
  completed_at        timestamptz
);

comment on table editorial_ai_job_runs is
  'Technical execution log of every AI model call within the editorial pipeline. Separate from editorial_jobs (human work items).';
comment on column editorial_ai_job_runs.job_id is
  'Optional FK to the editorial_job that initiated this run; null for system-triggered runs.';
comment on column editorial_ai_job_runs.prompt_version_id is
  'The approved prompt version actually used in this run for reproducibility.';
comment on column editorial_ai_job_runs.input_payload is
  'Full request sent to the model: system prompt, messages, parameters.';
comment on column editorial_ai_job_runs.output_payload is
  'Full raw response received from the model.';
comment on column editorial_ai_job_runs.cost_usd is
  'Computed from input_tokens × cost_per_1k_input + output_tokens × cost_per_1k_output.';

create index if not exists idx_ai_job_runs_project
  on editorial_ai_job_runs(project_id);
create index if not exists idx_ai_job_runs_stage
  on editorial_ai_job_runs(project_id, stage);
create index if not exists idx_ai_job_runs_job
  on editorial_ai_job_runs(job_id)
  where job_id is not null;
create index if not exists idx_ai_job_runs_status
  on editorial_ai_job_runs(status);
create index if not exists idx_ai_job_runs_model
  on editorial_ai_job_runs(model_config_id)
  where model_config_id is not null;
create index if not exists idx_ai_job_runs_created
  on editorial_ai_job_runs(created_at desc);


-- ============================================================
-- 6. EDITORIAL AI QUALITY CHECKS
-- ============================================================
-- Automated, per-run quality gate results.
-- Distinct from editorial_ai_quality_scores: checks are binary/graded
-- pass-fail gates per run; scores are aggregated time-series values.
-- ============================================================

create table if not exists editorial_ai_quality_checks (
  id              uuid        primary key default gen_random_uuid(),
  project_id      uuid        not null
                    references editorial_projects(id) on delete cascade,
  -- Optional: link to the run that produced this check
  job_run_id      uuid
                    references editorial_ai_job_runs(id) on delete set null,
  stage           text        not null
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  -- Check category, e.g. 'grammar', 'structure', 'style', 'consistency'
  check_type      text        not null,
  -- Human-readable check name, e.g. 'Passive voice overuse check'
  check_name      text        not null,

  status          text        not null default 'pending'
                    check (status in ('pending','passed','failed','warning','skipped')),

  -- Normalised score for this single check in [0, 100]
  score           numeric(5,2)
                    check (score >= 0 and score <= 100),

  -- Evidence, sub-results, or actionable suggestions
  details         jsonb       not null default '{}',

  -- True if the system automatically corrected the issue
  auto_resolved   boolean     not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_ai_quality_checks is
  'Automated quality gate results tied to a specific AI job run and stage. Not aggregated — see editorial_ai_quality_scores for rolled-up values.';
comment on column editorial_ai_quality_checks.check_type is
  'Category of the check: grammar | structure | style | consistency | completeness | etc.';
comment on column editorial_ai_quality_checks.score is
  'Normalised score in [0, 100] for this individual gate; NULL when not applicable.';
comment on column editorial_ai_quality_checks.details is
  'Structured JSONB: sub-scores, affected passages, suggested corrections.';
comment on column editorial_ai_quality_checks.auto_resolved is
  'True when the system automatically fixed the issue without human intervention.';

create index if not exists idx_ai_quality_checks_project
  on editorial_ai_quality_checks(project_id);
create index if not exists idx_ai_quality_checks_stage
  on editorial_ai_quality_checks(project_id, stage);
create index if not exists idx_ai_quality_checks_run
  on editorial_ai_quality_checks(job_run_id)
  where job_run_id is not null;
create index if not exists idx_ai_quality_checks_status
  on editorial_ai_quality_checks(status);


-- ============================================================
-- 7. EDITORIAL AI QUALITY SCORES
-- ============================================================
-- Aggregated, weighted, time-stamped quality scores per project and
-- optional stage. Distinct from quality_checks: scores are computed
-- rollups suitable for dashboards and trend analysis.
-- ============================================================

create table if not exists editorial_ai_quality_scores (
  id              uuid        primary key default gen_random_uuid(),
  project_id      uuid        not null
                    references editorial_projects(id) on delete cascade,

  -- NULL = project-level aggregate; a stage value = stage-level score
  stage           text
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  -- e.g. 'overall', 'grammar', 'style', 'structure', 'ai_confidence'
  score_type      text        not null,

  -- Normalised score in [0, 100]
  score           numeric(5,2) not null
                    check (score >= 0 and score <= 100),

  -- Relative weight used when computing cross-type parent aggregates
  weight          numeric(5,4) not null default 1.0
                    check (weight > 0),

  -- When this snapshot was computed
  computed_at     timestamptz not null default now(),

  -- Supporting metadata: component scores, sample size, algorithm version
  metadata        jsonb       not null default '{}',

  created_at      timestamptz not null default now()
);

comment on table editorial_ai_quality_scores is
  'Time-series of aggregated quality scores per project, stage, and score type. Derived from editorial_ai_quality_checks; used for dashboards and trend analysis.';
comment on column editorial_ai_quality_scores.stage is
  'NULL = project-level aggregate across all stages.';
comment on column editorial_ai_quality_scores.score_type is
  'Dimension being scored: overall | grammar | style | structure | ai_confidence.';
comment on column editorial_ai_quality_scores.weight is
  'Relative weight when this score is used in a parent-level weighted average.';
comment on column editorial_ai_quality_scores.metadata is
  'Provenance: component_count, total_weight, algorithm_version, source_check_ids.';

create index if not exists idx_ai_quality_scores_project
  on editorial_ai_quality_scores(project_id);
create index if not exists idx_ai_quality_scores_stage
  on editorial_ai_quality_scores(project_id, stage);
create index if not exists idx_ai_quality_scores_type
  on editorial_ai_quality_scores(score_type);
create index if not exists idx_ai_quality_scores_time
  on editorial_ai_quality_scores(computed_at desc);


-- ============================================================
-- 8. EDITORIAL AI FINDING FEEDBACK
-- ============================================================
-- Structured human feedback on individual AI findings.
-- Feeds the model and prompt improvement loop.
-- ============================================================

create table if not exists editorial_ai_finding_feedback (
  id              uuid        primary key default gen_random_uuid(),
  finding_id      uuid        not null
                    references editorial_ai_findings(id) on delete cascade,

  feedback_type   text        not null
                    check (feedback_type in (
                      'helpful','not_helpful','false_positive',
                      'needs_improvement','correct'
                    )),

  comment         text,

  -- Optional 1–5 star quality rating
  rating          integer
                    check (rating >= 1 and rating <= 5),

  submitted_by    uuid        references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table editorial_ai_finding_feedback is
  'Human quality feedback on individual AI findings. Used to drive model and prompt improvement loops.';
comment on column editorial_ai_finding_feedback.feedback_type is
  'helpful | not_helpful | false_positive | needs_improvement | correct.';
comment on column editorial_ai_finding_feedback.rating is
  'Optional 1 (very poor) to 5 (excellent) star rating of the finding quality.';
comment on column editorial_ai_finding_feedback.comment is
  'Free-text editor explanation to enrich the feedback signal.';

create index if not exists idx_ai_finding_feedback_finding
  on editorial_ai_finding_feedback(finding_id);
create index if not exists idx_ai_finding_feedback_user
  on editorial_ai_finding_feedback(submitted_by)
  where submitted_by is not null;
create index if not exists idx_ai_finding_feedback_type
  on editorial_ai_finding_feedback(feedback_type);


-- ============================================================
-- 9. EDITORIAL AI AUDIT EVENTS
-- ============================================================
-- Immutable, append-only audit log for all material AI actions.
-- Written exclusively via the service role so RLS cannot block inserts.
-- ============================================================

create table if not exists editorial_ai_audit_events (
  id              uuid        primary key default gen_random_uuid(),
  org_id          uuid        not null references organizations(id) on delete cascade,

  -- Type of the object this event describes
  entity_type     text        not null,
                                -- project | job | finding | prompt_template |
                                -- prompt_version | policy | model_config |
                                -- job_run | quality_check | queue_item
  entity_id       uuid        not null,

  -- Verb describing what happened
  action          text        not null,
                                -- created | updated | deleted | approved |
                                -- rejected | run_started | run_completed | etc.

  -- Who / what performed the action
  actor_id        uuid        references profiles(id) on delete set null,
  actor_type      text        not null default 'system'
                    check (actor_type in ('user','system','ai')),

  -- State snapshots for diff-based auditing
  previous_state  jsonb,
  new_state       jsonb,

  -- Extra context: request_id, ip_address, client_version, etc.
  metadata        jsonb       not null default '{}',

  -- Immutable timestamp; no updated_at column intentionally
  created_at      timestamptz not null default now()
);

comment on table editorial_ai_audit_events is
  'Immutable, append-only audit trail of all material AI-related actions in the editorial pipeline. No updates or deletes should be permitted on this table.';
comment on column editorial_ai_audit_events.entity_type is
  'Discriminator: project | job | finding | prompt_template | prompt_version | policy | model_config | job_run | quality_check | queue_item.';
comment on column editorial_ai_audit_events.actor_type is
  'user = human editor; system = automated pipeline; ai = model-initiated action.';
comment on column editorial_ai_audit_events.previous_state is
  'Full entity snapshot before the action; NULL for ''created'' events.';
comment on column editorial_ai_audit_events.new_state is
  'Full entity snapshot after the action; NULL for ''deleted'' events.';
comment on column editorial_ai_audit_events.metadata is
  'Request-scoped context: request_id, ip_address, user_agent, trigger source.';

create index if not exists idx_ai_audit_events_org
  on editorial_ai_audit_events(org_id);
create index if not exists idx_ai_audit_events_entity
  on editorial_ai_audit_events(entity_type, entity_id);
create index if not exists idx_ai_audit_events_actor
  on editorial_ai_audit_events(actor_id)
  where actor_id is not null;
create index if not exists idx_ai_audit_events_created
  on editorial_ai_audit_events(created_at desc);


-- ============================================================
-- 10. EDITORIAL AI REVIEW QUEUES
-- ============================================================
-- Named queues that route AI-generated items to the right reviewers.
-- ============================================================

create table if not exists editorial_ai_review_queues (
  id              uuid        primary key default gen_random_uuid(),
  org_id          uuid        not null references organizations(id) on delete cascade,

  name            text        not null,
  description     text,

  queue_type      text        not null
                    check (queue_type in (
                      'finding_review','prompt_approval',
                      'quality_review','policy_exception'
                    )),

  -- Optional: restrict queue to items from a specific pipeline stage
  stage           text
                    check (stage in (
                      'ingesta','estructura','estilo',
                      'ortotipografia','maquetacion','revision_final'
                    )),

  -- Role required to process items; NULL = any authenticated staff
  assigned_role   text
                    check (assigned_role in ('superadmin','admin','sales','ops','client')),

  -- Default assignee when no explicit assignment is made
  auto_assign_to  uuid        references profiles(id) on delete set null,

  is_active       boolean     not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table editorial_ai_review_queues is
  'Named review queues that route editorial AI items to the appropriate human reviewers.';
comment on column editorial_ai_review_queues.queue_type is
  'finding_review | prompt_approval | quality_review | policy_exception.';
comment on column editorial_ai_review_queues.stage is
  'When set, the queue only accepts items from that pipeline stage. NULL = any stage.';
comment on column editorial_ai_review_queues.assigned_role is
  'Minimum app role required to process items. NULL = any authenticated staff.';
comment on column editorial_ai_review_queues.auto_assign_to is
  'Default assignee profile when no explicit assignment exists.';

create index if not exists idx_ai_review_queues_org_active
  on editorial_ai_review_queues(org_id, is_active);
create index if not exists idx_ai_review_queues_type
  on editorial_ai_review_queues(queue_type);


-- ============================================================
-- 11. EDITORIAL AI QUEUE ITEMS
-- ============================================================
-- Individual items placed into a review queue awaiting human action.
-- ============================================================

create table if not exists editorial_ai_queue_items (
  id              uuid        primary key default gen_random_uuid(),
  queue_id        uuid        not null
                    references editorial_ai_review_queues(id) on delete cascade,

  -- What object this item is about
  entity_type     text        not null,
  entity_id       uuid        not null,

  -- Denormalised for efficient filtering without extra joins
  project_id      uuid        references editorial_projects(id) on delete cascade,

  priority        text        not null default 'normal'
                    check (priority in ('low','normal','high','urgent')),

  status          text        not null default 'pending'
                    check (status in (
                      'pending','in_progress','completed','skipped','escalated'
                    )),

  assigned_to     uuid        references profiles(id) on delete set null,

  -- Optional SLA deadline
  due_at          timestamptz,

  -- Reviewer-facing context: excerpt, finding summary, policy match, etc.
  context         jsonb       not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Set when status reaches completed, skipped, or escalated
  completed_at    timestamptz,
  completed_by    uuid        references profiles(id) on delete set null
);

comment on table editorial_ai_queue_items is
  'Individual items placed in an editorial AI review queue awaiting human action.';
comment on column editorial_ai_queue_items.entity_type is
  'Matches editorial_ai_audit_events.entity_type — discriminates what entity_id points to.';
comment on column editorial_ai_queue_items.project_id is
  'Denormalised for efficient per-project queue lookups without extra joins.';
comment on column editorial_ai_queue_items.priority is
  'low | normal | high | urgent — determines ordering within the queue.';
comment on column editorial_ai_queue_items.context is
  'Reviewer-facing JSONB: text excerpt, finding summary, policy match details, etc.';
comment on column editorial_ai_queue_items.due_at is
  'Optional SLA deadline. Items past due_at should be escalated by the system.';
comment on column editorial_ai_queue_items.completed_at is
  'Timestamp set when status transitions to completed, skipped, or escalated.';

create index if not exists idx_ai_queue_items_queue_status
  on editorial_ai_queue_items(queue_id, status);
create index if not exists idx_ai_queue_items_project
  on editorial_ai_queue_items(project_id)
  where project_id is not null;
create index if not exists idx_ai_queue_items_assigned
  on editorial_ai_queue_items(assigned_to)
  where assigned_to is not null;
create index if not exists idx_ai_queue_items_priority_order
  on editorial_ai_queue_items(queue_id, priority desc, created_at asc);
create index if not exists idx_ai_queue_items_due
  on editorial_ai_queue_items(due_at asc)
  where due_at is not null and status = 'pending';


-- ============================================================
-- ROW LEVEL SECURITY
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

-- ---- 1. editorial_ai_policies ----
drop policy if exists "staff read ai_policies"   on editorial_ai_policies;
drop policy if exists "admin write ai_policies"  on editorial_ai_policies;

create policy "staff read ai_policies"
  on editorial_ai_policies for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin','ops')
  );

create policy "admin write ai_policies"
  on editorial_ai_policies for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin')
  );

-- ---- 2. editorial_ai_model_configs ----
drop policy if exists "staff read ai_model_configs"  on editorial_ai_model_configs;
drop policy if exists "admin write ai_model_configs" on editorial_ai_model_configs;

create policy "staff read ai_model_configs"
  on editorial_ai_model_configs for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin','ops')
  );

create policy "admin write ai_model_configs"
  on editorial_ai_model_configs for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin')
  );

-- ---- 3. editorial_ai_stage_model_rules ----
drop policy if exists "staff read ai_stage_model_rules"  on editorial_ai_stage_model_rules;
drop policy if exists "admin write ai_stage_model_rules" on editorial_ai_stage_model_rules;

create policy "staff read ai_stage_model_rules"
  on editorial_ai_stage_model_rules for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin','ops')
  );

create policy "admin write ai_stage_model_rules"
  on editorial_ai_stage_model_rules for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin')
  );

-- ---- 4. editorial_ai_prompt_versions ----
drop policy if exists "staff read ai_prompt_versions"  on editorial_ai_prompt_versions;
drop policy if exists "admin write ai_prompt_versions" on editorial_ai_prompt_versions;

create policy "staff read ai_prompt_versions"
  on editorial_ai_prompt_versions for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_ai_prompt_templates t
      where t.id = editorial_ai_prompt_versions.prompt_template_id
        and t.org_id = public.get_my_org_id()
    )
  );

create policy "admin write ai_prompt_versions"
  on editorial_ai_prompt_versions for all
  using (
    public.get_my_role() in ('superadmin','admin')
    and exists (
      select 1
      from editorial_ai_prompt_templates t
      where t.id = editorial_ai_prompt_versions.prompt_template_id
        and t.org_id = public.get_my_org_id()
    )
  );

-- ---- 5. editorial_ai_job_runs ----
drop policy if exists "staff read ai_job_runs"  on editorial_ai_job_runs;
drop policy if exists "staff write ai_job_runs" on editorial_ai_job_runs;

create policy "staff read ai_job_runs"
  on editorial_ai_job_runs for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_job_runs.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff write ai_job_runs"
  on editorial_ai_job_runs for all
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_job_runs.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- ---- 6. editorial_ai_quality_checks ----
drop policy if exists "staff read ai_quality_checks"  on editorial_ai_quality_checks;
drop policy if exists "staff write ai_quality_checks" on editorial_ai_quality_checks;

create policy "staff read ai_quality_checks"
  on editorial_ai_quality_checks for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_quality_checks.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff write ai_quality_checks"
  on editorial_ai_quality_checks for all
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_quality_checks.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- ---- 7. editorial_ai_quality_scores ----
drop policy if exists "staff read ai_quality_scores"  on editorial_ai_quality_scores;
drop policy if exists "staff write ai_quality_scores" on editorial_ai_quality_scores;

create policy "staff read ai_quality_scores"
  on editorial_ai_quality_scores for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_quality_scores.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff write ai_quality_scores"
  on editorial_ai_quality_scores for all
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_projects p
      where p.id = editorial_ai_quality_scores.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- ---- 8. editorial_ai_finding_feedback ----
drop policy if exists "staff read ai_finding_feedback"  on editorial_ai_finding_feedback;
drop policy if exists "staff write ai_finding_feedback" on editorial_ai_finding_feedback;

create policy "staff read ai_finding_feedback"
  on editorial_ai_finding_feedback for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_ai_findings  f
      join editorial_projects     p on p.id = f.project_id
      where f.id = editorial_ai_finding_feedback.finding_id
        and p.org_id = public.get_my_org_id()
    )
  );

create policy "staff write ai_finding_feedback"
  on editorial_ai_finding_feedback for all
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_ai_findings  f
      join editorial_projects     p on p.id = f.project_id
      where f.id = editorial_ai_finding_feedback.finding_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- ---- 9. editorial_ai_audit_events (read-only via RLS; inserts via service role) ----
drop policy if exists "admin read ai_audit_events" on editorial_ai_audit_events;

create policy "admin read ai_audit_events"
  on editorial_ai_audit_events for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin')
  );

-- ---- 10. editorial_ai_review_queues ----
drop policy if exists "staff read ai_review_queues"  on editorial_ai_review_queues;
drop policy if exists "admin write ai_review_queues" on editorial_ai_review_queues;

create policy "staff read ai_review_queues"
  on editorial_ai_review_queues for select
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin','ops')
  );

create policy "admin write ai_review_queues"
  on editorial_ai_review_queues for all
  using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('superadmin','admin')
  );

-- ---- 11. editorial_ai_queue_items ----
drop policy if exists "staff read ai_queue_items"  on editorial_ai_queue_items;
drop policy if exists "staff write ai_queue_items" on editorial_ai_queue_items;

create policy "staff read ai_queue_items"
  on editorial_ai_queue_items for select
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_ai_review_queues q
      where q.id = editorial_ai_queue_items.queue_id
        and q.org_id = public.get_my_org_id()
    )
  );

create policy "staff write ai_queue_items"
  on editorial_ai_queue_items for all
  using (
    public.get_my_role() in ('superadmin','admin','ops')
    and exists (
      select 1
      from editorial_ai_review_queues q
      where q.id = editorial_ai_queue_items.queue_id
        and q.org_id = public.get_my_org_id()
    )
  );
