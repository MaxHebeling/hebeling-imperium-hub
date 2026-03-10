-- =========================================================
-- Phase 13 — Analytics, Forecasting & Executive Intelligence
-- scripts/017_editorial_analytics_forecasting_intelligence.sql
-- =========================================================

begin;

-- =========================================================
-- TABLE 1: editorial_metric_definitions
-- =========================================================

create table if not exists public.editorial_metric_definitions (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,
  description text null,
  metric_category text not null,
  unit_type text not null,
  aggregation_type text not null,
  active boolean not null default true,
  owner_department_code text null,
  metadata jsonb null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_metric_definitions_category_check
    check (
      metric_category in (
        'operations',
        'sales',
        'finance',
        'distribution',
        'quality',
        'customer_success',
        'executive',
        'forecasting'
      )
    ),

  constraint editorial_metric_definitions_unit_type_check
    check (
      unit_type in (
        'count',
        'currency',
        'percentage',
        'hours',
        'days',
        'score',
        'ratio',
        'text',
        'other'
      )
    ),

  constraint editorial_metric_definitions_aggregation_check
    check (
      aggregation_type in (
        'sum',
        'avg',
        'min',
        'max',
        'latest',
        'count',
        'ratio',
        'custom'
      )
    )
);

comment on table public.editorial_metric_definitions is
'Catalog of defined metrics for analytics, scorecards and forecasting.';

create index if not exists idx_editorial_metric_definitions_code
  on public.editorial_metric_definitions (code);

create index if not exists idx_editorial_metric_definitions_metric_category
  on public.editorial_metric_definitions (metric_category);

create index if not exists idx_editorial_metric_definitions_active
  on public.editorial_metric_definitions (active);


-- =========================================================
-- TABLE 2: editorial_metric_snapshots
-- =========================================================

create table if not exists public.editorial_metric_snapshots (
  id uuid primary key default gen_random_uuid(),

  metric_definition_id uuid not null
    references public.editorial_metric_definitions(id)
    on delete cascade,

  snapshot_date date not null,
  period_type text not null,

  scope_type text not null,
  scope_id uuid null,

  numeric_value numeric(18,4) null,
  text_value text null,
  json_value jsonb null,

  source_table text null,
  source_record_id uuid null,

  created_at timestamptz not null default now(),

  constraint editorial_metric_snapshots_period_type_check
    check (
      period_type in (
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly',
        'point_in_time'
      )
    ),

  constraint editorial_metric_snapshots_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project',
        'client_account',
        'opportunity',
        'channel',
        'format',
        'other'
      )
    )
);

comment on table public.editorial_metric_snapshots is
'Stores metric values over time for time-series analytics and reporting.';

create index if not exists idx_editorial_metric_snapshots_metric_definition_id
  on public.editorial_metric_snapshots (metric_definition_id);

create index if not exists idx_editorial_metric_snapshots_snapshot_date
  on public.editorial_metric_snapshots (snapshot_date);

create index if not exists idx_editorial_metric_snapshots_period_type
  on public.editorial_metric_snapshots (period_type);

create index if not exists idx_editorial_metric_snapshots_scope
  on public.editorial_metric_snapshots (scope_type, scope_id);


-- =========================================================
-- TABLE 3: editorial_forecast_models
-- =========================================================

create table if not exists public.editorial_forecast_models (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,
  description text null,
  forecast_domain text not null,
  method_type text not null,
  active boolean not null default true,
  version_label text null,
  configuration jsonb null,

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_forecast_models_domain_check
    check (
      forecast_domain in (
        'sales',
        'revenue',
        'collections',
        'project_volume',
        'delivery_capacity',
        'distribution',
        'staffing',
        'quality',
        'executive'
      )
    ),

  constraint editorial_forecast_models_method_check
    check (
      method_type in (
        'manual',
        'moving_average',
        'weighted_pipeline',
        'regression',
        'scenario',
        'ai_generated',
        'hybrid'
      )
    )
);

comment on table public.editorial_forecast_models is
'Registry of forecasting models or methods used for predictions.';

create index if not exists idx_editorial_forecast_models_code
  on public.editorial_forecast_models (code);

create index if not exists idx_editorial_forecast_models_forecast_domain
  on public.editorial_forecast_models (forecast_domain);

create index if not exists idx_editorial_forecast_models_active
  on public.editorial_forecast_models (active);


-- =========================================================
-- TABLE 4: editorial_forecast_runs
-- =========================================================

create table if not exists public.editorial_forecast_runs (
  id uuid primary key default gen_random_uuid(),

  model_id uuid not null
    references public.editorial_forecast_models(id)
    on delete cascade,

  forecast_period_start date not null,
  forecast_period_end date not null,
  run_date date not null,

  scope_type text not null default 'global',
  scope_id uuid null,

  status text not null default 'draft',

  input_payload jsonb null,
  assumptions jsonb null,
  summary text null,

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_forecast_runs_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project',
        'client_account',
        'sales_pipeline',
        'distribution',
        'other'
      )
    ),

  constraint editorial_forecast_runs_status_check
    check (status in ('draft', 'completed', 'superseded', 'cancelled')),

  constraint editorial_forecast_runs_period_check
    check (forecast_period_end >= forecast_period_start)
);

comment on table public.editorial_forecast_runs is
'Specific forecast execution runs; outputs stored in editorial_forecast_values.';

create index if not exists idx_editorial_forecast_runs_model_id
  on public.editorial_forecast_runs (model_id);

create index if not exists idx_editorial_forecast_runs_period
  on public.editorial_forecast_runs (forecast_period_start, forecast_period_end);

create index if not exists idx_editorial_forecast_runs_run_date
  on public.editorial_forecast_runs (run_date);

create index if not exists idx_editorial_forecast_runs_scope
  on public.editorial_forecast_runs (scope_type, scope_id);

create index if not exists idx_editorial_forecast_runs_status
  on public.editorial_forecast_runs (status);


-- =========================================================
-- TABLE 5: editorial_forecast_values
-- =========================================================

create table if not exists public.editorial_forecast_values (
  id uuid primary key default gen_random_uuid(),

  forecast_run_id uuid not null
    references public.editorial_forecast_runs(id)
    on delete cascade,

  metric_code text not null,
  dimension_key text null,
  period_date date not null,

  predicted_value numeric(18,4) null,
  low_estimate numeric(18,4) null,
  high_estimate numeric(18,4) null,
  confidence_score numeric(5,2) null,

  notes text null,

  created_at timestamptz not null default now()
);

comment on table public.editorial_forecast_values is
'Detailed outputs from forecast runs (predicted values, confidence intervals).';

create index if not exists idx_editorial_forecast_values_forecast_run_id
  on public.editorial_forecast_values (forecast_run_id);

create index if not exists idx_editorial_forecast_values_metric_code
  on public.editorial_forecast_values (metric_code);

create index if not exists idx_editorial_forecast_values_period_date
  on public.editorial_forecast_values (period_date);

create index if not exists idx_editorial_forecast_values_dimension_key
  on public.editorial_forecast_values (dimension_key);


-- =========================================================
-- TABLE 6: editorial_scorecards
-- =========================================================

create table if not exists public.editorial_scorecards (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,
  description text null,
  scorecard_type text not null,
  scope_type text not null,
  active boolean not null default true,
  configuration jsonb null,

  created_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_scorecards_type_check
    check (
      scorecard_type in (
        'executive',
        'department',
        'staff',
        'project_portfolio',
        'sales',
        'finance',
        'operations',
        'distribution',
        'custom'
      )
    ),

  constraint editorial_scorecards_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project',
        'client_account',
        'other'
      )
    )
);

comment on table public.editorial_scorecards is
'Reusable executive or departmental scorecard definitions.';

create index if not exists idx_editorial_scorecards_code
  on public.editorial_scorecards (code);

create index if not exists idx_editorial_scorecards_scorecard_type
  on public.editorial_scorecards (scorecard_type);

create index if not exists idx_editorial_scorecards_scope_type
  on public.editorial_scorecards (scope_type);

create index if not exists idx_editorial_scorecards_active
  on public.editorial_scorecards (active);


-- =========================================================
-- TABLE 7: editorial_scorecard_results
-- =========================================================

create table if not exists public.editorial_scorecard_results (
  id uuid primary key default gen_random_uuid(),

  scorecard_id uuid not null
    references public.editorial_scorecards(id)
    on delete cascade,

  result_date date not null,
  scope_id uuid null,

  overall_score numeric(10,2) null,
  status text not null default 'normal',

  summary text null,
  component_scores jsonb null,
  recommendations jsonb null,

  created_at timestamptz not null default now(),

  constraint editorial_scorecard_results_status_check
    check (
      status in (
        'excellent',
        'good',
        'normal',
        'warning',
        'critical'
      )
    )
);

comment on table public.editorial_scorecard_results is
'Calculated scorecard results over time.';

create index if not exists idx_editorial_scorecard_results_scorecard_id
  on public.editorial_scorecard_results (scorecard_id);

create index if not exists idx_editorial_scorecard_results_result_date
  on public.editorial_scorecard_results (result_date);

create index if not exists idx_editorial_scorecard_results_scope_id
  on public.editorial_scorecard_results (scope_id);

create index if not exists idx_editorial_scorecard_results_status
  on public.editorial_scorecard_results (status);


-- =========================================================
-- TABLE 8: editorial_trend_analyses
-- =========================================================

create table if not exists public.editorial_trend_analyses (
  id uuid primary key default gen_random_uuid(),

  metric_definition_id uuid null
    references public.editorial_metric_definitions(id)
    on delete set null,

  analysis_date date not null,
  scope_type text not null,
  scope_id uuid null,

  trend_direction text not null,
  change_percent numeric(10,2) null,
  baseline_value numeric(18,4) null,
  current_value numeric(18,4) null,

  summary text null,
  details jsonb null,

  created_at timestamptz not null default now(),

  constraint editorial_trend_analyses_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project',
        'client_account',
        'channel',
        'other'
      )
    ),

  constraint editorial_trend_analyses_trend_direction_check
    check (
      trend_direction in (
        'up',
        'down',
        'flat',
        'volatile',
        'seasonal',
        'insufficient_data'
      )
    )
);

comment on table public.editorial_trend_analyses is
'Stores detected trend summaries for metrics over time.';

create index if not exists idx_editorial_trend_analyses_metric_definition_id
  on public.editorial_trend_analyses (metric_definition_id);

create index if not exists idx_editorial_trend_analyses_analysis_date
  on public.editorial_trend_analyses (analysis_date);

create index if not exists idx_editorial_trend_analyses_scope
  on public.editorial_trend_analyses (scope_type, scope_id);

create index if not exists idx_editorial_trend_analyses_trend_direction
  on public.editorial_trend_analyses (trend_direction);


-- =========================================================
-- TABLE 9: editorial_anomaly_signals
-- =========================================================

create table if not exists public.editorial_anomaly_signals (
  id uuid primary key default gen_random_uuid(),

  metric_definition_id uuid null
    references public.editorial_metric_definitions(id)
    on delete set null,

  related_project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  signal_date date not null,
  scope_type text not null,
  scope_id uuid null,

  severity text not null,
  signal_type text not null,

  expected_value numeric(18,4) null,
  actual_value numeric(18,4) null,
  deviation_percent numeric(10,2) null,

  title text not null,
  description text null,
  recommended_action text null,

  status text not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_anomaly_signals_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project',
        'client_account',
        'channel',
        'other'
      )
    ),

  constraint editorial_anomaly_signals_severity_check
    check (severity in ('info', 'warning', 'error', 'critical')),

  constraint editorial_anomaly_signals_status_check
    check (status in ('open', 'acknowledged', 'resolved', 'ignored'))
);

comment on table public.editorial_anomaly_signals is
'Detected anomalies or unusual conditions for metrics.';

create index if not exists idx_editorial_anomaly_signals_metric_definition_id
  on public.editorial_anomaly_signals (metric_definition_id);

create index if not exists idx_editorial_anomaly_signals_related_project_id
  on public.editorial_anomaly_signals (related_project_id);

create index if not exists idx_editorial_anomaly_signals_signal_date
  on public.editorial_anomaly_signals (signal_date);

create index if not exists idx_editorial_anomaly_signals_scope
  on public.editorial_anomaly_signals (scope_type, scope_id);

create index if not exists idx_editorial_anomaly_signals_severity
  on public.editorial_anomaly_signals (severity);

create index if not exists idx_editorial_anomaly_signals_status
  on public.editorial_anomaly_signals (status);


-- =========================================================
-- TABLE 10: editorial_executive_reports
-- =========================================================

create table if not exists public.editorial_executive_reports (
  id uuid primary key default gen_random_uuid(),

  report_code text not null unique,
  title text not null,
  report_type text not null,
  reporting_period_start date not null,
  reporting_period_end date not null,

  scope_type text not null default 'global',
  scope_id uuid null,

  status text not null default 'draft',

  summary text null,
  highlights jsonb null,
  risks jsonb null,
  opportunities jsonb null,
  recommendations jsonb null,

  generated_by uuid null references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_executive_reports_type_check
    check (
      report_type in (
        'weekly_exec',
        'monthly_exec',
        'quarterly_exec',
        'sales_review',
        'finance_review',
        'operations_review',
        'distribution_review',
        'custom'
      )
    ),

  constraint editorial_executive_reports_scope_type_check
    check (
      scope_type in (
        'global',
        'department',
        'staff',
        'project_portfolio',
        'client_segment',
        'other'
      )
    ),

  constraint editorial_executive_reports_status_check
    check (status in ('draft', 'published', 'archived')),

  constraint editorial_executive_reports_period_check
    check (reporting_period_end >= reporting_period_start)
);

comment on table public.editorial_executive_reports is
'Generated executive reporting records for dashboards and distribution.';

create index if not exists idx_editorial_executive_reports_report_code
  on public.editorial_executive_reports (report_code);

create index if not exists idx_editorial_executive_reports_report_type
  on public.editorial_executive_reports (report_type);

create index if not exists idx_editorial_executive_reports_period
  on public.editorial_executive_reports (reporting_period_start, reporting_period_end);

create index if not exists idx_editorial_executive_reports_scope
  on public.editorial_executive_reports (scope_type, scope_id);

create index if not exists idx_editorial_executive_reports_status
  on public.editorial_executive_reports (status);


-- =========================================================
-- TABLE 11: editorial_recommendation_signals
-- =========================================================

create table if not exists public.editorial_recommendation_signals (
  id uuid primary key default gen_random_uuid(),

  recommendation_type text not null,
  domain text not null,

  related_project_id uuid null
    references public.editorial_projects(id)
    on delete set null,

  related_opportunity_id uuid null
    references public.editorial_crm_opportunities(id)
    on delete set null,

  related_client_account_id uuid null
    references public.editorial_client_accounts(id)
    on delete set null,

  priority text not null default 'medium',
  status text not null default 'open',

  title text not null,
  description text not null,
  expected_impact text null,
  recommended_action text null,

  confidence_score numeric(5,2) null,
  source_type text not null default 'rule_based',
  supporting_data jsonb null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint editorial_recommendation_signals_domain_check
    check (
      domain in (
        'sales',
        'finance',
        'operations',
        'distribution',
        'quality',
        'customer_success',
        'executive'
      )
    ),

  constraint editorial_recommendation_signals_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),

  constraint editorial_recommendation_signals_status_check
    check (
      status in (
        'open',
        'reviewing',
        'accepted',
        'rejected',
        'implemented',
        'archived'
      )
    ),

  constraint editorial_recommendation_signals_source_type_check
    check (source_type in ('rule_based', 'ai_generated', 'hybrid', 'manual'))
);

comment on table public.editorial_recommendation_signals is
'AI-assisted or rule-based strategic recommendations.';

create index if not exists idx_editorial_recommendation_signals_type
  on public.editorial_recommendation_signals (recommendation_type);

create index if not exists idx_editorial_recommendation_signals_domain
  on public.editorial_recommendation_signals (domain);

create index if not exists idx_editorial_recommendation_signals_related_project_id
  on public.editorial_recommendation_signals (related_project_id);

create index if not exists idx_editorial_recommendation_signals_related_opportunity_id
  on public.editorial_recommendation_signals (related_opportunity_id);

create index if not exists idx_editorial_recommendation_signals_related_client_account_id
  on public.editorial_recommendation_signals (related_client_account_id);

create index if not exists idx_editorial_recommendation_signals_priority
  on public.editorial_recommendation_signals (priority);

create index if not exists idx_editorial_recommendation_signals_status
  on public.editorial_recommendation_signals (status);


-- =========================================================
-- TABLE 12: editorial_intelligence_events
-- =========================================================

create table if not exists public.editorial_intelligence_events (
  id uuid primary key default gen_random_uuid(),

  event_type text not null,
  entity_type text not null,
  entity_id uuid null,

  actor_user_id uuid null references auth.users(id),

  summary text not null,
  payload jsonb null,

  created_at timestamptz not null default now()
);

comment on table public.editorial_intelligence_events is
'Audit trail for analytics, forecasting and intelligence generation.';

create index if not exists idx_editorial_intelligence_events_event_type
  on public.editorial_intelligence_events (event_type);

create index if not exists idx_editorial_intelligence_events_entity
  on public.editorial_intelligence_events (entity_type, entity_id);

create index if not exists idx_editorial_intelligence_events_actor_user_id
  on public.editorial_intelligence_events (actor_user_id);

create index if not exists idx_editorial_intelligence_events_created_at
  on public.editorial_intelligence_events (created_at desc);


-- =========================================================
-- SEED DATA: editorial_metric_definitions
-- =========================================================

insert into public.editorial_metric_definitions (code, name, description, metric_category, unit_type, aggregation_type)
values
  ('active_projects_count',        'Active Projects Count',           'Number of projects in active editorial workflow.',           'operations',  'count',   'count'),
  ('open_tasks_count',             'Open Tasks Count',                'Number of open operational tasks.',                          'operations',  'count',   'sum'),
  ('sla_breach_count',             'SLA Breach Count',                 'Number of SLA trackers breached in period.',                 'operations',  'count',   'sum'),
  ('marketplace_orders_count',     'Marketplace Orders Count',        'Number of marketplace orders in period.',                    'sales',      'count',   'count'),
  ('distribution_submissions_count','Distribution Submissions Count', 'Number of distribution submissions in period.',                'distribution','count',  'count'),
  ('monthly_pipeline_value',       'Monthly Pipeline Value',          'Total estimated value of open opportunities.',                'sales',      'currency','sum'),
  ('monthly_invoiced_amount',      'Monthly Invoiced Amount',         'Total amount invoiced in period.',                            'finance',    'currency','sum'),
  ('monthly_collected_amount',     'Monthly Collected Amount',        'Total payments collected in period.',                        'finance',    'currency','sum'),
  ('gross_margin_estimate',       'Gross Margin Estimate',           'Estimated gross margin (revenue minus direct costs).',        'finance',    'percentage','avg'),
  ('quote_acceptance_rate',        'Quote Acceptance Rate',           'Percentage of sent quotes that were accepted.',               'sales',      'percentage','ratio'),
  ('lead_to_opportunity_rate',     'Lead to Opportunity Rate',        'Percentage of qualified leads converted to opportunities.',   'sales',      'percentage','ratio'),
  ('opportunity_win_rate',         'Opportunity Win Rate',            'Percentage of opportunities closed as won.',                  'sales',      'percentage','ratio')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  metric_category = excluded.metric_category,
  unit_type = excluded.unit_type,
  aggregation_type = excluded.aggregation_type,
  active = true,
  updated_at = now();


-- =========================================================
-- SEED DATA: editorial_forecast_models
-- =========================================================

insert into public.editorial_forecast_models (code, name, description, forecast_domain, method_type, configuration)
values
  ('weighted_pipeline_revenue_forecast', 'Weighted Pipeline Revenue Forecast', 'Revenue forecast from weighted pipeline by stage.', 'sales', 'weighted_pipeline', '{"default_probability_by_stage": {"discovery": 0.1, "qualification": 0.2, "proposal": 0.4, "negotiation": 0.6, "verbal_commitment": 0.9, "won": 1.0}}'::jsonb),
  ('monthly_collections_forecast',      'Monthly Collections Forecast',      'Forecast of expected collections by month.',           'collections', 'moving_average', '{"window_months": 3, "seasonality_adjustment": false}'::jsonb),
  ('delivery_capacity_forecast',         'Delivery Capacity Forecast',         'Forecast of delivery capacity by staff/department.',   'delivery_capacity', 'manual', '{"inputs": ["workload_snapshots", "assignments"]}'::jsonb),
  ('project_volume_forecast',            'Project Volume Forecast',            'Forecast of project starts and completions.',          'project_volume', 'scenario', '{"scenarios": ["baseline", "optimistic", "conservative"]}'::jsonb)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  forecast_domain = excluded.forecast_domain,
  method_type = excluded.method_type,
  configuration = excluded.configuration,
  active = true,
  updated_at = now();


-- =========================================================
-- SEED DATA: editorial_scorecards
-- =========================================================

insert into public.editorial_scorecards (code, name, description, scorecard_type, scope_type, configuration)
values
  ('executive_health',   'Executive Health',   'Overall company health scorecard.',           'executive',        'global', '{"components": ["revenue_health", "pipeline_health", "operations_health", "quality_health"], "weights": {}}'::jsonb),
  ('sales_performance',  'Sales Performance',  'Sales pipeline and conversion scorecard.',    'sales',            'global', '{"components": ["pipeline_value", "quote_acceptance", "win_rate", "lead_conversion"], "thresholds": {}}'::jsonb),
  ('operations_health',  'Operations Health',  'Operational tasks, SLA and workload scorecard.', 'operations',     'global', '{"components": ["sla_compliance", "task_throughput", "workload_balance"], "thresholds": {}}'::jsonb),
  ('finance_health',     'Finance Health',     'Revenue, collections and margin scorecard.',    'finance',          'global', '{"components": ["collections_rate", "outstanding_aging", "gross_margin"], "thresholds": {}}'::jsonb)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  scorecard_type = excluded.scorecard_type,
  scope_type = excluded.scope_type,
  configuration = excluded.configuration,
  active = true,
  updated_at = now();


-- =========================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================

alter table public.editorial_metric_definitions    enable row level security;
alter table public.editorial_metric_snapshots     enable row level security;
alter table public.editorial_forecast_models      enable row level security;
alter table public.editorial_forecast_runs        enable row level security;
alter table public.editorial_forecast_values      enable row level security;
alter table public.editorial_scorecards           enable row level security;
alter table public.editorial_scorecard_results    enable row level security;
alter table public.editorial_trend_analyses       enable row level security;
alter table public.editorial_anomaly_signals      enable row level security;
alter table public.editorial_executive_reports    enable row level security;
alter table public.editorial_recommendation_signals enable row level security;
alter table public.editorial_intelligence_events  enable row level security;

-- All analytics/intelligence tables are internal; only staff and service_role have access.


-- =========================================================
-- RLS: editorial_metric_definitions
-- =========================================================

create policy editorial_metric_definitions_select_staff
  on public.editorial_metric_definitions
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_metric_definitions_manage_staff
  on public.editorial_metric_definitions
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_metric_snapshots
-- =========================================================

create policy editorial_metric_snapshots_select_staff
  on public.editorial_metric_snapshots
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_metric_snapshots_manage_staff
  on public.editorial_metric_snapshots
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_forecast_models
-- =========================================================

create policy editorial_forecast_models_select_staff
  on public.editorial_forecast_models
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_forecast_models_manage_staff
  on public.editorial_forecast_models
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_forecast_runs
-- =========================================================

create policy editorial_forecast_runs_select_staff
  on public.editorial_forecast_runs
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_forecast_runs_manage_staff
  on public.editorial_forecast_runs
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_forecast_values
-- =========================================================

create policy editorial_forecast_values_select_staff
  on public.editorial_forecast_values
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_forecast_values_manage_staff
  on public.editorial_forecast_values
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_scorecards
-- =========================================================

create policy editorial_scorecards_select_staff
  on public.editorial_scorecards
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_scorecards_manage_staff
  on public.editorial_scorecards
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_scorecard_results
-- =========================================================

create policy editorial_scorecard_results_select_staff
  on public.editorial_scorecard_results
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_scorecard_results_manage_staff
  on public.editorial_scorecard_results
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_trend_analyses
-- =========================================================

create policy editorial_trend_analyses_select_staff
  on public.editorial_trend_analyses
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_trend_analyses_manage_staff
  on public.editorial_trend_analyses
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_anomaly_signals
-- =========================================================

create policy editorial_anomaly_signals_select_staff
  on public.editorial_anomaly_signals
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_anomaly_signals_manage_staff
  on public.editorial_anomaly_signals
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_executive_reports
-- =========================================================

create policy editorial_executive_reports_select_staff
  on public.editorial_executive_reports
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_executive_reports_manage_staff
  on public.editorial_executive_reports
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_recommendation_signals
-- =========================================================

create policy editorial_recommendation_signals_select_staff
  on public.editorial_recommendation_signals
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_recommendation_signals_manage_staff
  on public.editorial_recommendation_signals
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


-- =========================================================
-- RLS: editorial_intelligence_events
-- =========================================================

create policy editorial_intelligence_events_select_staff
  on public.editorial_intelligence_events
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );

create policy editorial_intelligence_events_insert_staff
  on public.editorial_intelligence_events
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.editorial_staff_profiles sp
      where sp.user_id = auth.uid()
        and sp.active = true
    )
  );


commit;
