-- =============================================================================
-- Phase 10 — Reino Editorial OS / Unified Operating System
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Introduces the operational backbone of the editorial company.
-- Unifies project operations, staff assignments, workload visibility,
-- SLA tracking, task management, finance, KPI dashboards, alerts,
-- and auditability — all anchored to editorial_projects.
--
-- 11 new tables:
--   1.  editorial_departments              — internal departments / functions
--   2.  editorial_staff_profiles           — operational staff profiles
--   3.  editorial_project_assignments      — staff assignment to projects
--   4.  editorial_operational_tasks        — internal tasks across the OS
--   5.  editorial_sla_policies             — SLA target configuration
--   6.  editorial_sla_trackers             — concrete SLA timers per record
--   7.  editorial_workload_snapshots       — periodic workload metrics per staff
--   8.  editorial_financial_ledger         — project-level financial entries
--   9.  editorial_alerts                   — operational alerts and notifications
--   10. editorial_kpi_snapshots            — periodic KPI metrics for dashboards
--   11. editorial_os_events                — high-level OS audit event stream
--
-- Seed data: departments + SLA policies.
--
-- Depends on:
--   001_schema.sql                (profiles, organizations, auth.users)
--   009_editorial_phase4a.sql     (editorial_projects)
--   014_editorial_marketplace.sql (editorial_marketplace_orders)
--   015_editorial_distribution_engine.sql (editorial_distribution_submissions)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL DEPARTMENTS
-- ============================================================
-- Internal departments / functional areas of the editorial company.
-- Used to group staff, tasks, SLAs, and KPIs.
-- ============================================================

create table if not exists editorial_departments (
  id                    uuid        primary key default gen_random_uuid(),

  -- Stable machine-readable code (e.g. 'editorial', 'design')
  code                  text        not null unique,

  name                  text        not null,
  description           text,

  active                boolean     not null default true,

  created_at            timestamptz not null default now()
);

comment on table editorial_departments is
  'Internal departments of the editorial company. Used to group staff, tasks, SLA policies, and KPI snapshots.';
comment on column editorial_departments.code is
  'Stable machine-readable identifier, e.g. "editorial", "design", "qa".';

create index if not exists idx_departments_active
  on editorial_departments(active)
  where active = true;


-- ── Seed: default departments ──────────────────────────────────────────────

insert into editorial_departments (code, name, description)
values
  ('editorial',        'Editorial',         'Manuscript review, developmental and line editing, copyediting'),
  ('design',           'Design',            'Cover design, interior layout, and typography'),
  ('production',       'Production',        'File preparation, format conversion, and quality-control packaging'),
  ('qa',               'Quality Assurance', 'Editorial QA, fact-checking, and standards compliance'),
  ('distribution',     'Distribution',      'Book distribution channel management and submissions'),
  ('customer_success', 'Customer Success',  'Author relations, onboarding, and support'),
  ('finance',          'Finance',           'Project billing, contractor payments, and financial reporting'),
  ('leadership',       'Leadership',        'Executive oversight and company-level decision making')
on conflict (code) do nothing;


-- ============================================================
-- 2. EDITORIAL STAFF PROFILES
-- ============================================================
-- Operational profile for internal staff users.
-- One row per staff member (UNIQUE on user_id).
-- Tracks capacity, skills, and timezone for workload management.
-- ============================================================

create table if not exists editorial_staff_profiles (
  id                    uuid        primary key default gen_random_uuid(),

  -- The Supabase Auth user behind this staff profile
  user_id               uuid        not null unique
                          references auth.users(id) on delete cascade,

  department_id         uuid
                          references editorial_departments(id) on delete set null,

  display_name          text        not null,
  role_title            text,

  active                boolean     not null default true,

  -- Total available capacity in abstract "points" per sprint / period
  -- 100 = fully available; <100 = partial availability
  capacity_points       integer     not null default 100
                          check (capacity_points >= 0 and capacity_points <= 200),

  -- IANA timezone identifier (e.g. 'America/Mexico_City')
  timezone              text,

  -- Tag-style skills array (e.g. '{"copyediting","style_editing","spanish"}')
  skills                text[],

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table editorial_staff_profiles is
  'Operational profiles for internal staff users. Tracks department, capacity, timezone, and skills for workload management.';
comment on column editorial_staff_profiles.capacity_points is
  'Relative capacity 0-200; 100 = fully available. Used to compute utilization.';
comment on column editorial_staff_profiles.skills is
  'Freeform skill tags, e.g. {"copyediting","spanish","epub_conversion"}.';

create index if not exists idx_staff_profiles_department
  on editorial_staff_profiles(department_id);

create index if not exists idx_staff_profiles_active
  on editorial_staff_profiles(active)
  where active = true;


-- ============================================================
-- 3. EDITORIAL PROJECT ASSIGNMENTS
-- ============================================================
-- Assignment of a staff member to a project in a specific role.
-- A staff member can have multiple roles across different projects,
-- and multiple roles on the same project.
-- ============================================================

create table if not exists editorial_project_assignments (
  id                    uuid        primary key default gen_random_uuid(),

  project_id            uuid        not null
                          references editorial_projects(id) on delete cascade,

  staff_profile_id      uuid        not null
                          references editorial_staff_profiles(id) on delete restrict,

  -- Role this staff member plays on this project
  assignment_role       text        not null
                          check (assignment_role in (
                            'project_manager',
                            'developmental_editor',
                            'line_editor',
                            'copy_editor',
                            'proofreader',
                            'designer',
                            'formatter',
                            'qa_reviewer',
                            'distribution_manager',
                            'customer_success_manager',
                            'operations_lead',
                            'other'
                          )),

  -- Percentage of this staff member's capacity allocated to this project
  allocation_percent    integer     not null default 100
                          check (allocation_percent > 0 and allocation_percent <= 100),

  starts_at             timestamptz,
  ends_at               timestamptz,

  active                boolean     not null default true,

  created_at            timestamptz not null default now()
);

comment on table editorial_project_assignments is
  'Assignment of a staff member to a project with a specific role and capacity allocation.';
comment on column editorial_project_assignments.assignment_role is
  'Functional role for this assignment: project_manager | developmental_editor | line_editor | copy_editor | proofreader | designer | formatter | qa_reviewer | distribution_manager | customer_success_manager | operations_lead | other.';
comment on column editorial_project_assignments.allocation_percent is
  'Percentage of the staff member''s capacity allocated to this project (1-100).';

create index if not exists idx_project_assignments_project
  on editorial_project_assignments(project_id);

create index if not exists idx_project_assignments_staff
  on editorial_project_assignments(staff_profile_id);

create index if not exists idx_project_assignments_role
  on editorial_project_assignments(assignment_role);

create index if not exists idx_project_assignments_active
  on editorial_project_assignments(active)
  where active = true;

create index if not exists idx_project_assignments_project_active
  on editorial_project_assignments(project_id, active)
  where active = true;


-- ============================================================
-- 4. EDITORIAL OPERATIONAL TASKS
-- ============================================================
-- Internal tasks that can be linked to a project and/or assignment.
-- Drives the operational queue and staff to-do lists.
-- ============================================================

create table if not exists editorial_operational_tasks (
  id                    uuid        primary key default gen_random_uuid(),

  -- Optional project context
  project_id            uuid
                          references editorial_projects(id) on delete cascade,

  -- Optional assignment context
  assignment_id         uuid
                          references editorial_project_assignments(id) on delete set null,

  -- Task creator
  created_by            uuid
                          references auth.users(id) on delete set null,

  -- Assigned owner
  owner_user_id         uuid
                          references auth.users(id) on delete set null,

  -- Task classification (free-form; allows future extension without schema changes)
  task_type             text        not null,

  title                 text        not null,
  description           text,

  -- Scheduling
  priority              text        not null default 'medium'
                          check (priority in ('low', 'medium', 'high', 'urgent')),

  status                text        not null default 'open'
                          check (status in (
                            'open',
                            'queued',
                            'in_progress',
                            'blocked',
                            'review',
                            'completed',
                            'cancelled'
                          )),

  -- Department that owns this task
  department_id         uuid
                          references editorial_departments(id) on delete set null,

  due_at                timestamptz,
  started_at            timestamptz,
  completed_at          timestamptz,

  -- Flexible metadata (checklist items, external links, etc.)
  metadata              jsonb       not null default '{}',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table editorial_operational_tasks is
  'Internal operational tasks across the OS. Can be linked to projects, assignments, and departments.';
comment on column editorial_operational_tasks.task_type is
  'Free-form classification, e.g. "manuscript_handoff", "cover_design_request", "sla_escalation".';
comment on column editorial_operational_tasks.priority is
  'low | medium | high | urgent.';
comment on column editorial_operational_tasks.status is
  'open → queued → in_progress → (blocked →)* review → completed | cancelled.';

create index if not exists idx_op_tasks_project
  on editorial_operational_tasks(project_id);

create index if not exists idx_op_tasks_owner
  on editorial_operational_tasks(owner_user_id);

create index if not exists idx_op_tasks_department
  on editorial_operational_tasks(department_id);

create index if not exists idx_op_tasks_priority
  on editorial_operational_tasks(priority);

create index if not exists idx_op_tasks_status
  on editorial_operational_tasks(status);

create index if not exists idx_op_tasks_due
  on editorial_operational_tasks(due_at)
  where due_at is not null;

create index if not exists idx_op_tasks_status_priority
  on editorial_operational_tasks(status, priority)
  where status not in ('completed', 'cancelled');


-- ============================================================
-- 5. EDITORIAL SLA POLICIES
-- ============================================================
-- Service level target configuration by workflow area.
-- Referenced by editorial_sla_trackers for concrete timers.
-- ============================================================

create table if not exists editorial_sla_policies (
  id                    uuid        primary key default gen_random_uuid(),

  -- Stable machine-readable code (e.g. 'stage_structure_review')
  code                  text        not null unique,

  name                  text        not null,
  description           text,

  -- What kind of entity this SLA applies to
  scope_type            text        not null
                          check (scope_type in (
                            'project_stage',
                            'task_type',
                            'marketplace_order',
                            'distribution_submission',
                            'qa_review',
                            'support_case'
                          )),

  -- Total target duration in calendar hours
  target_hours          integer     not null
                          check (target_hours > 0),

  -- Percent of target_hours elapsed before showing warning (default 80%)
  warning_threshold_percent   integer not null default 80
                                check (warning_threshold_percent > 0 and warning_threshold_percent < 100),

  -- Percent of target_hours elapsed when SLA is considered breached (default 100%)
  critical_threshold_percent  integer not null default 100
                                check (critical_threshold_percent > 0),

  active                boolean     not null default true,

  created_at            timestamptz not null default now()
);

comment on table editorial_sla_policies is
  'SLA (service level agreement) target configuration per workflow area. Referenced by sla_trackers for concrete timers.';
comment on column editorial_sla_policies.target_hours is
  'Maximum allowed elapsed time in calendar hours.';
comment on column editorial_sla_policies.warning_threshold_percent is
  'Percentage of target_hours elapsed before the tracker enters "warning" breach level.';

create index if not exists idx_sla_policies_scope
  on editorial_sla_policies(scope_type);

create index if not exists idx_sla_policies_active
  on editorial_sla_policies(active)
  where active = true;


-- ── Seed: default SLA policies ─────────────────────────────────────────────

insert into editorial_sla_policies
  (code, name, description, scope_type, target_hours, warning_threshold_percent, critical_threshold_percent)
values
  ('stage_structure_review',
   'Stage: Estructura Review',
   'SLA for completing the Estructura editorial stage review',
   'project_stage', 72, 75, 100),

  ('stage_style_review',
   'Stage: Estilo Review',
   'SLA for completing the Estilo editorial stage review',
   'project_stage', 96, 75, 100),

  ('stage_orthotypography_review',
   'Stage: Ortotipografía Review',
   'SLA for completing the Ortotipografía editorial stage review',
   'project_stage', 48, 80, 100),

  ('marketplace_delivery',
   'Marketplace: Order Delivery',
   'SLA for professional delivery of a marketplace service order',
   'marketplace_order', 168, 80, 100),    -- 7 days

  ('distribution_submission_processing',
   'Distribution: Submission Processing',
   'SLA for a distribution submission to reach "approved" or "published" status',
   'distribution_submission', 720, 80, 100), -- 30 days

  ('qa_findings_review',
   'QA: Findings Review',
   'SLA for resolving open QA/AI findings after delivery',
   'qa_review', 24, 75, 100)
on conflict (code) do nothing;


-- ============================================================
-- 6. EDITORIAL SLA TRACKERS
-- ============================================================
-- Concrete SLA timers attached to specific project / task / order /
-- submission records. One tracker per (sla_policy, entity).
-- ============================================================

create table if not exists editorial_sla_trackers (
  id                    uuid        primary key default gen_random_uuid(),

  sla_policy_id         uuid        not null
                          references editorial_sla_policies(id) on delete restrict,

  -- Exactly one of the four entity FKs must be non-null
  project_id            uuid        references editorial_projects(id) on delete cascade,
  task_id               uuid        references editorial_operational_tasks(id) on delete cascade,
  order_id              uuid        references editorial_marketplace_orders(id) on delete cascade,
  submission_id         uuid        references editorial_distribution_submissions(id) on delete cascade,

  -- Timer bounds
  starts_at             timestamptz not null,
  due_at                timestamptz not null,
  completed_at          timestamptz,

  -- Current state
  status                text        not null default 'active'
                          check (status in ('active', 'completed', 'breached', 'cancelled')),

  -- Computed breach level (updated by periodic job or trigger)
  breach_level          text        not null default 'none'
                          check (breach_level in ('none', 'warning', 'critical')),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Require at least one entity context
  constraint chk_sla_tracker_has_context check (
    project_id    is not null or
    task_id       is not null or
    order_id      is not null or
    submission_id is not null
  )
);

comment on table editorial_sla_trackers is
  'Concrete SLA timers per entity. Each row tracks one SLA policy against a project, task, order, or submission.';
comment on column editorial_sla_trackers.breach_level is
  'none | warning | critical — updated by a periodic evaluation job.';

create index if not exists idx_sla_trackers_policy
  on editorial_sla_trackers(sla_policy_id);

create index if not exists idx_sla_trackers_project
  on editorial_sla_trackers(project_id);

create index if not exists idx_sla_trackers_task
  on editorial_sla_trackers(task_id);

create index if not exists idx_sla_trackers_order
  on editorial_sla_trackers(order_id);

create index if not exists idx_sla_trackers_submission
  on editorial_sla_trackers(submission_id);

create index if not exists idx_sla_trackers_status
  on editorial_sla_trackers(status);

-- Fast lookup for breach evaluation jobs
create index if not exists idx_sla_trackers_active_due
  on editorial_sla_trackers(status, due_at)
  where status = 'active';


-- ============================================================
-- 7. EDITORIAL WORKLOAD SNAPSHOTS
-- ============================================================
-- Periodic workload metrics per staff member.
-- Generated by a scheduled job; one row per (staff, date).
-- Used for capacity planning dashboards.
-- ============================================================

create table if not exists editorial_workload_snapshots (
  id                    uuid        primary key default gen_random_uuid(),

  staff_profile_id      uuid        not null
                          references editorial_staff_profiles(id) on delete cascade,

  snapshot_date         date        not null,

  -- Assignment metrics at snapshot time
  active_assignments_count    integer     not null default 0 check (active_assignments_count >= 0),
  open_tasks_count            integer     not null default 0 check (open_tasks_count >= 0),
  in_progress_tasks_count     integer     not null default 0 check (in_progress_tasks_count >= 0),
  urgent_tasks_count          integer     not null default 0 check (urgent_tasks_count >= 0),

  -- Capacity allocation at snapshot time
  allocated_percent_total     integer     not null default 0 check (allocated_percent_total >= 0),
  capacity_points             integer     not null default 100,

  -- Computed utilization: allocated_percent_total relative to capacity
  utilization_percent         numeric(5,2) not null default 0,

  created_at            timestamptz not null default now(),

  unique (staff_profile_id, snapshot_date)
);

comment on table editorial_workload_snapshots is
  'Periodic (daily) workload metrics per staff member. Generated by a scheduled job for capacity planning.';
comment on column editorial_workload_snapshots.utilization_percent is
  'Computed: (allocated_percent_total / capacity_points) * 100. May exceed 100 if overallocated.';

create index if not exists idx_workload_snapshots_staff
  on editorial_workload_snapshots(staff_profile_id);

create index if not exists idx_workload_snapshots_date
  on editorial_workload_snapshots(snapshot_date desc);

create index if not exists idx_workload_snapshots_staff_date
  on editorial_workload_snapshots(staff_profile_id, snapshot_date desc);


-- ============================================================
-- 8. EDITORIAL FINANCIAL LEDGER
-- ============================================================
-- Double-entry-inspired operational ledger for project economics.
-- Tracks income and expenses at the project level.
-- Not a replacement for a full accounting system — a lightweight
-- operational financial layer that feeds KPI dashboards.
-- ============================================================

create table if not exists editorial_financial_ledger (
  id                    uuid        primary key default gen_random_uuid(),

  -- Project context (optional for platform-level entries)
  project_id            uuid
                          references editorial_projects(id) on delete cascade,

  -- Optional marketplace order reference
  order_id              uuid
                          references editorial_marketplace_orders(id) on delete set null,

  -- Entry classification
  entry_type            text        not null
                          check (entry_type in (
                            'project_sale',
                            'marketplace_purchase',
                            'contractor_payout',
                            'refund',
                            'distribution_cost',
                            'design_cost',
                            'editing_cost',
                            'qa_cost',
                            'platform_fee',
                            'manual_adjustment',
                            'other'
                          )),

  -- Functional category (e.g. 'royalty', 'service_fee', 'contractor')
  category              text        not null,

  amount                numeric(14,2) not null
                          check (amount >= 0),

  -- ISO-4217 currency code
  currency              text        not null default 'USD',

  -- Flow direction
  direction             text        not null
                          check (direction in ('income', 'expense')),

  -- Optional reference code for reconciliation
  reference_code        text,

  notes                 text,

  recorded_by           uuid
                          references auth.users(id) on delete set null,

  entry_date            date        not null,

  created_at            timestamptz not null default now()
);

comment on table editorial_financial_ledger is
  'Operational financial ledger per project. Tracks income and expenses for KPI dashboards and project-level economics.';
comment on column editorial_financial_ledger.direction is
  'income = money coming in; expense = money going out.';
comment on column editorial_financial_ledger.reference_code is
  'External invoice or transaction reference for reconciliation.';

create index if not exists idx_fin_ledger_project
  on editorial_financial_ledger(project_id);

create index if not exists idx_fin_ledger_order
  on editorial_financial_ledger(order_id);

create index if not exists idx_fin_ledger_entry_type
  on editorial_financial_ledger(entry_type);

create index if not exists idx_fin_ledger_direction
  on editorial_financial_ledger(direction);

create index if not exists idx_fin_ledger_entry_date
  on editorial_financial_ledger(entry_date desc);

create index if not exists idx_fin_ledger_project_date
  on editorial_financial_ledger(project_id, entry_date desc);


-- ============================================================
-- 9. EDITORIAL ALERTS
-- ============================================================
-- Operational alerts and internal notifications.
-- Can be linked to any major entity in the OS.
-- Supports acknowledge + resolve workflow.
-- ============================================================

create table if not exists editorial_alerts (
  id                    uuid        primary key default gen_random_uuid(),

  -- Optional entity links (at least one should be set for actionable alerts)
  project_id            uuid        references editorial_projects(id) on delete cascade,
  task_id               uuid        references editorial_operational_tasks(id) on delete cascade,
  order_id              uuid        references editorial_marketplace_orders(id) on delete cascade,
  submission_id         uuid        references editorial_distribution_submissions(id) on delete cascade,

  -- Classification
  alert_type            text        not null,
  severity              text        not null
                          check (severity in ('info', 'warning', 'error', 'critical')),

  title                 text        not null,
  message               text,

  -- Alert lifecycle
  status                text        not null default 'open'
                          check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),

  -- Routing
  assigned_user_id      uuid        references auth.users(id) on delete set null,

  -- Resolution tracking
  acknowledged_by       uuid        references auth.users(id) on delete set null,
  acknowledged_at       timestamptz,
  resolved_at           timestamptz,

  -- Additional context data
  payload               jsonb,

  created_at            timestamptz not null default now()
);

comment on table editorial_alerts is
  'Operational alerts and internal notifications. Supports assignment, acknowledgement, and resolution workflow.';
comment on column editorial_alerts.alert_type is
  'Free-form discriminator, e.g. "sla_breach", "qa_failure", "delivery_overdue", "payment_failed".';
comment on column editorial_alerts.severity is
  'info | warning | error | critical.';

create index if not exists idx_alerts_project
  on editorial_alerts(project_id);

create index if not exists idx_alerts_task
  on editorial_alerts(task_id);

create index if not exists idx_alerts_order
  on editorial_alerts(order_id);

create index if not exists idx_alerts_submission
  on editorial_alerts(submission_id);

create index if not exists idx_alerts_severity
  on editorial_alerts(severity);

create index if not exists idx_alerts_status
  on editorial_alerts(status);

create index if not exists idx_alerts_assigned
  on editorial_alerts(assigned_user_id);

create index if not exists idx_alerts_created
  on editorial_alerts(created_at desc);

-- Fast open alert polling
create index if not exists idx_alerts_open_severity
  on editorial_alerts(status, severity)
  where status in ('open', 'acknowledged');


-- ============================================================
-- 10. EDITORIAL KPI SNAPSHOTS
-- ============================================================
-- Periodic aggregated metrics for executive and operational dashboards.
-- One row per (scope_type, scope_id, snapshot_date).
-- Generated by a scheduled job.
-- ============================================================

create table if not exists editorial_kpi_snapshots (
  id                    uuid        primary key default gen_random_uuid(),

  snapshot_date         date        not null,

  -- Scope of this snapshot
  scope_type            text        not null
                          check (scope_type in ('global', 'department', 'staff', 'project')),

  -- The specific entity this snapshot is for (null for global)
  scope_id              uuid,

  -- Key metrics at snapshot time
  total_active_projects           integer     not null default 0 check (total_active_projects >= 0),
  total_overdue_tasks             integer     not null default 0 check (total_overdue_tasks >= 0),
  total_sla_breaches              integer     not null default 0 check (total_sla_breaches >= 0),
  total_open_alerts               integer     not null default 0 check (total_open_alerts >= 0),
  total_marketplace_orders        integer     not null default 0 check (total_marketplace_orders >= 0),
  total_distribution_submissions  integer     not null default 0 check (total_distribution_submissions >= 0),

  -- Financial summary
  gross_income          numeric(14,2) not null default 0,
  gross_expense         numeric(14,2) not null default 0,
  net_value             numeric(14,2) not null default 0,

  created_at            timestamptz not null default now()
);

comment on table editorial_kpi_snapshots is
  'Periodic aggregated KPI metrics for dashboards. Scoped to global, department, staff, or project. Generated by a scheduled job.';
comment on column editorial_kpi_snapshots.scope_type is
  'global | department | staff | project.';
comment on column editorial_kpi_snapshots.scope_id is
  'UUID of the scoped entity (department.id, staff_profile.id, or project.id). NULL for global scope.';

create index if not exists idx_kpi_snapshots_date
  on editorial_kpi_snapshots(snapshot_date desc);

create index if not exists idx_kpi_snapshots_scope_type
  on editorial_kpi_snapshots(scope_type);

create index if not exists idx_kpi_snapshots_scope_id
  on editorial_kpi_snapshots(scope_id)
  where scope_id is not null;

create index if not exists idx_kpi_snapshots_scope_date
  on editorial_kpi_snapshots(scope_type, scope_id, snapshot_date desc);


-- ============================================================
-- 11. EDITORIAL OS EVENTS
-- ============================================================
-- High-level immutable audit / event stream for the operating system.
-- One row per significant action across the OS.
-- Written by application code — not user-editable via RLS.
-- ============================================================

create table if not exists editorial_os_events (
  id                    uuid        primary key default gen_random_uuid(),

  -- Optional project context
  project_id            uuid        references editorial_projects(id) on delete cascade,

  -- Actor who triggered the event (null = system/automated)
  actor_user_id         uuid        references auth.users(id) on delete set null,

  -- Event classification
  event_type            text        not null,

  -- The entity this event is about
  entity_type           text        not null,
  entity_id             uuid,

  -- Human-readable summary line for event logs
  summary               text,

  -- Structured event context
  payload               jsonb,

  created_at            timestamptz not null default now()
);

comment on table editorial_os_events is
  'Immutable audit/event stream for the Reino Editorial OS. One row per significant action. Written by application code only.';
comment on column editorial_os_events.event_type is
  'e.g. "task_created", "sla_breached", "alert_resolved", "assignment_changed", "ledger_entry_added".';
comment on column editorial_os_events.entity_type is
  'The type of entity affected, e.g. "task", "project", "assignment", "sla_tracker", "alert".';
comment on column editorial_os_events.actor_user_id is
  'NULL when triggered by a background job or automated workflow.';

create index if not exists idx_os_events_project
  on editorial_os_events(project_id);

create index if not exists idx_os_events_actor
  on editorial_os_events(actor_user_id);

create index if not exists idx_os_events_type
  on editorial_os_events(event_type);

create index if not exists idx_os_events_entity_type
  on editorial_os_events(entity_type);

create index if not exists idx_os_events_created
  on editorial_os_events(created_at desc);

create index if not exists idx_os_events_project_created
  on editorial_os_events(project_id, created_at desc);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Staff (superadmin, admin, ops) can fully manage all OS tables.
--   2. Authorized project members (via editorial_projects.created_by) can read
--      OS records tied to projects they own.
--   3. Finance, staffing, workload, and KPI write access is staff/service-role only.
--   4. Audit/event tables are readable by staff; writes are service-role only.
--   5. Departments are readable by all authenticated users (reference data).
-- =============================================================================

alter table editorial_departments           enable row level security;
alter table editorial_staff_profiles        enable row level security;
alter table editorial_project_assignments   enable row level security;
alter table editorial_operational_tasks     enable row level security;
alter table editorial_sla_policies          enable row level security;
alter table editorial_sla_trackers          enable row level security;
alter table editorial_workload_snapshots    enable row level security;
alter table editorial_financial_ledger      enable row level security;
alter table editorial_alerts                enable row level security;
alter table editorial_kpi_snapshots         enable row level security;
alter table editorial_os_events             enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_departments (reference data — public read)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "anyone reads departments"   on editorial_departments;
create policy "anyone reads departments"
  on editorial_departments
  for select
  using (auth.uid() is not null);

drop policy if exists "staff manage departments"   on editorial_departments;
create policy "staff manage departments"
  on editorial_departments
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_staff_profiles
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read all profiles within their org
drop policy if exists "staff read staff profiles"  on editorial_staff_profiles;
create policy "staff read staff profiles"
  on editorial_staff_profiles
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Staff members can read and update their own profile
drop policy if exists "staff read own profile"     on editorial_staff_profiles;
create policy "staff read own profile"
  on editorial_staff_profiles
  for select
  using (user_id = auth.uid());

drop policy if exists "staff update own profile"   on editorial_staff_profiles;
create policy "staff update own profile"
  on editorial_staff_profiles
  for update
  using (user_id = auth.uid());

-- Admin/superadmin can create and manage all profiles
drop policy if exists "admin manage staff profiles" on editorial_staff_profiles;
create policy "admin manage staff profiles"
  on editorial_staff_profiles
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_project_assignments
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read all assignments within their org
drop policy if exists "staff read project assignments"  on editorial_project_assignments;
create policy "staff read project assignments"
  on editorial_project_assignments
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_project_assignments.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Admin/ops can create and manage assignments
drop policy if exists "admin write project assignments" on editorial_project_assignments;
create policy "admin write project assignments"
  on editorial_project_assignments
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_project_assignments.project_id
        and p.org_id = public.get_my_org_id()
    )
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_project_assignments.project_id
        and p.org_id = public.get_my_org_id()
    )
  );

-- Staff members can see assignments they are part of
drop policy if exists "staff read own assignments"      on editorial_project_assignments;
create policy "staff read own assignments"
  on editorial_project_assignments
  for select
  using (
    exists (
      select 1 from editorial_staff_profiles sp
      where sp.id = editorial_project_assignments.staff_profile_id
        and sp.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_operational_tasks
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read tasks within their org's projects
drop policy if exists "staff read op tasks"  on editorial_operational_tasks;
create policy "staff read op tasks"
  on editorial_operational_tasks
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_operational_tasks.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- Staff can manage tasks
drop policy if exists "staff write op tasks" on editorial_operational_tasks;
create policy "staff write op tasks"
  on editorial_operational_tasks
  for all
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
  )
  with check (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
  );

-- Task owners can read and update their own tasks
drop policy if exists "task owners read own tasks"   on editorial_operational_tasks;
create policy "task owners read own tasks"
  on editorial_operational_tasks
  for select
  using (owner_user_id = auth.uid());

drop policy if exists "task owners update own tasks" on editorial_operational_tasks;
create policy "task owners update own tasks"
  on editorial_operational_tasks
  for update
  using (owner_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_sla_policies (reference data)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read sla policies"   on editorial_sla_policies;
create policy "staff read sla policies"
  on editorial_sla_policies
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin manage sla policies" on editorial_sla_policies;
create policy "admin manage sla policies"
  on editorial_sla_policies
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_sla_trackers
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read sla trackers"  on editorial_sla_trackers;
create policy "staff read sla trackers"
  on editorial_sla_trackers
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_sla_trackers.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- SLA tracker writes are service-role / admin only
drop policy if exists "admin write sla trackers"  on editorial_sla_trackers;
create policy "admin write sla trackers"
  on editorial_sla_trackers
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Project owners can read SLA status for their projects
drop policy if exists "authors read own sla trackers" on editorial_sla_trackers;
create policy "authors read own sla trackers"
  on editorial_sla_trackers
  for select
  using (
    project_id is not null
    and exists (
      select 1 from editorial_projects p
      where p.id = editorial_sla_trackers.project_id
        and p.created_by = (
          select id from profiles where id = auth.uid() limit 1
        )
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_workload_snapshots (internal staff data)
-- ────────────────────────────────────────────────────────────────────────────

-- Admin/ops can read all snapshots
drop policy if exists "admin read workload snapshots"  on editorial_workload_snapshots;
create policy "admin read workload snapshots"
  on editorial_workload_snapshots
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Staff members can read their own workload snapshots
drop policy if exists "staff read own workload"        on editorial_workload_snapshots;
create policy "staff read own workload"
  on editorial_workload_snapshots
  for select
  using (
    exists (
      select 1 from editorial_staff_profiles sp
      where sp.id = editorial_workload_snapshots.staff_profile_id
        and sp.user_id = auth.uid()
    )
  );

-- Writes are service-role only (generated by scheduled jobs)


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_financial_ledger (sensitive — staff/admin only)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read financial ledger"  on editorial_financial_ledger;
create policy "staff read financial ledger"
  on editorial_financial_ledger
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_financial_ledger.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- Only admin/finance can create ledger entries
drop policy if exists "admin write financial ledger"  on editorial_financial_ledger;
create policy "admin write financial ledger"
  on editorial_financial_ledger
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 9: editorial_alerts
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read all alerts in their org
drop policy if exists "staff read alerts"    on editorial_alerts;
create policy "staff read alerts"
  on editorial_alerts
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_alerts.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- Staff can write alerts (creating, acknowledging, resolving)
drop policy if exists "staff write alerts"   on editorial_alerts;
create policy "staff write alerts"
  on editorial_alerts
  for all
  using  (public.get_my_role() in ('superadmin', 'admin', 'ops'))
  with check (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Alert assignees can read and update their own assigned alerts
drop policy if exists "assigned users read own alerts"   on editorial_alerts;
create policy "assigned users read own alerts"
  on editorial_alerts
  for select
  using (assigned_user_id = auth.uid());

drop policy if exists "assigned users update own alerts" on editorial_alerts;
create policy "assigned users update own alerts"
  on editorial_alerts
  for update
  using (assigned_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 10: editorial_kpi_snapshots (executive data — admin/ops read)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "admin read kpi snapshots"  on editorial_kpi_snapshots;
create policy "admin read kpi snapshots"
  on editorial_kpi_snapshots
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- KPI writes are service-role only (generated by scheduled jobs)


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 11: editorial_os_events (audit trail — read-only for users)
-- ────────────────────────────────────────────────────────────────────────────

-- Staff can read OS events for their org's projects
drop policy if exists "staff read os events"  on editorial_os_events;
create policy "staff read os events"
  on editorial_os_events
  for select
  using (
    public.get_my_role() in ('superadmin', 'admin', 'ops')
    and (
      project_id is null
      or exists (
        select 1 from editorial_projects p
        where p.id = editorial_os_events.project_id
          and p.org_id = public.get_my_org_id()
      )
    )
  );

-- OS event writes are service-role only (application code / background jobs)


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
