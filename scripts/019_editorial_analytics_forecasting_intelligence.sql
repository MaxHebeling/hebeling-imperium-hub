-- =============================================================================
-- Phase 13 — Analytics, Forecasting & Executive Intelligence
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Adds the executive intelligence layer for Reino Editorial:
-- consolidated metric definitions, time-series snapshots, forecasting models
-- and runs, scorecards, trend analysis, anomaly detection, executive reports,
-- AI-assisted recommendation signals, and an intelligence audit trail.
--
-- 12 new tables:
--   1.  editorial_metric_definitions          — catalog of defined metrics
--   2.  editorial_metric_snapshots            — time-series metric values
--   3.  editorial_forecast_models             — forecasting model registry
--   4.  editorial_forecast_runs               — specific forecast executions
--   5.  editorial_forecast_values             — detailed forecast outputs
--   6.  editorial_scorecards                  — reusable scorecard definitions
--   7.  editorial_scorecard_results           — calculated scorecard results
--   8.  editorial_trend_analyses              — detected trend summaries
--   9.  editorial_anomaly_signals             — unusual conditions / anomalies
--   10. editorial_executive_reports           — generated executive reports
--   11. editorial_recommendation_signals      — AI/rule-based recommendations
--   12. editorial_intelligence_events         — analytics audit trail
--
-- Seed data:
--   - 12 metric definitions
--   - 4 forecast models
--   - 4 scorecards
--
-- Depends on:
--   001_schema.sql                        (profiles, auth.users)
--   009_editorial_phase4a.sql             (editorial_projects)
--   017_editorial_crm_sales_pipeline.sql  (editorial_crm_opportunities)
--   018_editorial_billing_contracts_renewals.sql (editorial_client_accounts)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL METRIC DEFINITIONS
-- ============================================================
-- Catalog of every tracked metric in the system.
-- One row per metric type. Referenced by metric_snapshots,
-- trend_analyses, and anomaly_signals.
-- ============================================================

create table if not exists editorial_metric_definitions (
  id                      uuid          primary key default gen_random_uuid(),

  -- Stable machine-readable code (e.g. 'active_projects_count')
  code                    text          not null unique,

  name                    text          not null,
  description             text,

  -- Business domain this metric belongs to
  metric_category         text          not null
                            check (metric_category in (
                              'operations',
                              'sales',
                              'finance',
                              'distribution',
                              'quality',
                              'customer_success',
                              'executive',
                              'forecasting'
                            )),

  -- How the metric value should be interpreted
  unit_type               text          not null
                            check (unit_type in (
                              'count',
                              'currency',
                              'percentage',
                              'hours',
                              'days',
                              'score',
                              'ratio',
                              'text',
                              'other'
                            )),

  -- How the metric is aggregated across periods
  aggregation_type        text          not null
                            check (aggregation_type in (
                              'sum',
                              'avg',
                              'min',
                              'max',
                              'latest',
                              'count',
                              'ratio',
                              'custom'
                            )),

  active                  boolean       not null default true,

  -- The department that owns this metric (references editorial_departments.code)
  owner_department_code   text,

  -- Extra configuration (thresholds, display_format, target_value, etc.)
  metadata                jsonb         not null default '{}',

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_metric_definitions is
  'Catalog of all tracked metrics. One row per metric type. Referenced by metric_snapshots, trend analyses, and anomaly signals.';
comment on column editorial_metric_definitions.code is
  'Stable machine-readable identifier, e.g. "monthly_pipeline_value", "sla_breach_count".';
comment on column editorial_metric_definitions.aggregation_type is
  'How this metric is combined: sum | avg | min | max | latest | count | ratio | custom.';
comment on column editorial_metric_definitions.metadata is
  'Extra config: {target_value, thresholds: {warning, critical}, display_format, currency, etc.}.';

create index if not exists idx_metric_defs_category
  on editorial_metric_definitions(metric_category);

create index if not exists idx_metric_defs_active
  on editorial_metric_definitions(active)
  where active = true;


-- ── Seed: default metric definitions ──────────────────────────────────────

insert into editorial_metric_definitions
  (code, name, description, metric_category, unit_type, aggregation_type, owner_department_code)
values
  ('active_projects_count',
   'Active Projects',
   'Total number of editorial projects in an active status',
   'operations', 'count', 'count', 'editorial'),

  ('open_tasks_count',
   'Open Tasks',
   'Total number of operational tasks in open, queued, in_progress, or blocked status',
   'operations', 'count', 'count', 'editorial'),

  ('sla_breach_count',
   'SLA Breaches',
   'Total number of SLA trackers in breached status within the period',
   'operations', 'count', 'sum', 'qa'),

  ('marketplace_orders_count',
   'Marketplace Orders',
   'Total number of marketplace orders created within the period',
   'sales', 'count', 'count', 'customer_success'),

  ('distribution_submissions_count',
   'Distribution Submissions',
   'Total number of distribution submissions initiated within the period',
   'distribution', 'count', 'count', 'distribution'),

  ('monthly_pipeline_value',
   'Monthly Pipeline Value',
   'Sum of estimated_value across open sales opportunities',
   'sales', 'currency', 'sum', 'leadership'),

  ('monthly_invoiced_amount',
   'Monthly Invoiced Amount',
   'Total amount on invoices issued within the period',
   'finance', 'currency', 'sum', 'finance'),

  ('monthly_collected_amount',
   'Monthly Collected Amount',
   'Total amount of payments received within the period',
   'finance', 'currency', 'sum', 'finance'),

  ('gross_margin_estimate',
   'Gross Margin Estimate',
   'Estimated gross margin: (income - direct_costs) / income',
   'finance', 'percentage', 'avg', 'finance'),

  ('quote_acceptance_rate',
   'Quote Acceptance Rate',
   'Percentage of sent quotes that reach accepted status',
   'sales', 'percentage', 'ratio', 'leadership'),

  ('lead_to_opportunity_rate',
   'Lead-to-Opportunity Rate',
   'Percentage of qualified leads converted to opportunities',
   'sales', 'percentage', 'ratio', 'leadership'),

  ('opportunity_win_rate',
   'Opportunity Win Rate',
   'Percentage of opportunities that reach won status',
   'sales', 'percentage', 'ratio', 'leadership')
on conflict (code) do nothing;


-- ============================================================
-- 2. EDITORIAL METRIC SNAPSHOTS
-- ============================================================
-- Time-series store for metric values. One row per
-- (metric, date, period_type, scope). Written by scheduled jobs.
-- Supports numeric, text, and JSONB value types.
-- ============================================================

create table if not exists editorial_metric_snapshots (
  id                      uuid          primary key default gen_random_uuid(),

  metric_definition_id    uuid          not null
                            references editorial_metric_definitions(id) on delete cascade,

  snapshot_date           date          not null,

  -- Time granularity of this snapshot
  period_type             text          not null
                            check (period_type in (
                              'daily',
                              'weekly',
                              'monthly',
                              'quarterly',
                              'yearly',
                              'point_in_time'
                            )),

  -- What this snapshot is scoped to
  scope_type              text          not null
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project',
                              'client_account',
                              'opportunity',
                              'channel',
                              'format',
                              'other'
                            )),

  -- The specific entity this snapshot is for (NULL for global)
  scope_id                uuid,

  -- Value storage — one of these should be set depending on unit_type
  numeric_value           numeric,
  text_value              text,
  json_value              jsonb,

  -- Provenance — which table/record computed this value
  source_table            text,
  source_record_id        uuid,

  created_at              timestamptz   not null default now()
);

comment on table editorial_metric_snapshots is
  'Time-series store of metric values. One row per (metric, date, period, scope). Written by scheduled data jobs.';
comment on column editorial_metric_snapshots.scope_type is
  'Granularity: global | department | staff | project | client_account | opportunity | channel | format | other.';
comment on column editorial_metric_snapshots.source_table is
  'Source table that was queried to produce this snapshot, for data lineage.';

create index if not exists idx_metric_snapshots_definition
  on editorial_metric_snapshots(metric_definition_id);

create index if not exists idx_metric_snapshots_date
  on editorial_metric_snapshots(snapshot_date desc);

create index if not exists idx_metric_snapshots_period
  on editorial_metric_snapshots(period_type);

create index if not exists idx_metric_snapshots_scope_type
  on editorial_metric_snapshots(scope_type);

create index if not exists idx_metric_snapshots_scope_id
  on editorial_metric_snapshots(scope_id)
  where scope_id is not null;

-- Composite for the most common query pattern (metric + period + date range)
create index if not exists idx_metric_snapshots_def_period_date
  on editorial_metric_snapshots(metric_definition_id, period_type, snapshot_date desc);

-- Composite for scoped metric lookups
create index if not exists idx_metric_snapshots_scope_date
  on editorial_metric_snapshots(scope_type, scope_id, snapshot_date desc)
  where scope_id is not null;


-- ============================================================
-- 3. EDITORIAL FORECAST MODELS
-- ============================================================
-- Registry of forecasting models or methods. One row per model.
-- Parameterized via the `configuration` JSONB field.
-- ============================================================

create table if not exists editorial_forecast_models (
  id                      uuid          primary key default gen_random_uuid(),

  -- Stable machine-readable code
  code                    text          not null unique,

  name                    text          not null,
  description             text,

  -- Business domain this model covers
  forecast_domain         text          not null
                            check (forecast_domain in (
                              'sales',
                              'revenue',
                              'collections',
                              'project_volume',
                              'delivery_capacity',
                              'distribution',
                              'staffing',
                              'quality',
                              'executive'
                            )),

  -- Forecasting method used
  method_type             text          not null
                            check (method_type in (
                              'manual',
                              'moving_average',
                              'weighted_pipeline',
                              'regression',
                              'scenario',
                              'ai_generated',
                              'hybrid'
                            )),

  active                  boolean       not null default true,

  -- Human-readable version (e.g. 'v2.0 — includes marketplace data')
  version_label           text,

  -- Model configuration (look-back periods, weights, input metrics, etc.)
  configuration           jsonb         not null default '{}',

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_forecast_models is
  'Registry of forecasting models. One row per model definition. Parameterized via configuration JSONB.';
comment on column editorial_forecast_models.method_type is
  'manual | moving_average | weighted_pipeline | regression | scenario | ai_generated | hybrid.';
comment on column editorial_forecast_models.configuration is
  'Model parameters: {look_back_months, weights, input_metric_codes, scenario_name, etc.}.';

create index if not exists idx_forecast_models_domain
  on editorial_forecast_models(forecast_domain);

create index if not exists idx_forecast_models_active
  on editorial_forecast_models(active)
  where active = true;


-- ── Seed: default forecast models ──────────────────────────────────────────

insert into editorial_forecast_models
  (code, name, description, forecast_domain, method_type, version_label, configuration)
values
  ('weighted_pipeline_revenue_forecast',
   'Weighted Pipeline Revenue Forecast',
   'Projects future revenue using opportunity estimated_value × probability_percent across the open pipeline',
   'revenue', 'weighted_pipeline', 'v1.0',
   '{"input_table": "editorial_crm_opportunities", "status_filter": "open", "value_field": "estimated_value", "probability_field": "probability_percent", "horizon_months": 3}'),

  ('monthly_collections_forecast',
   'Monthly Collections Forecast',
   'Projects monthly cash collected using payment schedules and historical collection rates',
   'collections', 'moving_average', 'v1.0',
   '{"look_back_months": 3, "input_table": "editorial_received_payments", "amount_field": "amount", "seasonal_adjust": false}'),

  ('delivery_capacity_forecast',
   'Delivery Capacity Forecast',
   'Projects available editorial delivery capacity based on staff workload snapshots and active assignments',
   'delivery_capacity', 'manual', 'v1.0',
   '{"input_table": "editorial_workload_snapshots", "capacity_field": "capacity_points", "utilization_field": "utilization_percent", "horizon_weeks": 8}'),

  ('project_volume_forecast',
   'Project Volume Forecast',
   'Forecasts expected number of new projects based on pipeline conversion rates and historical trends',
   'project_volume', 'weighted_pipeline', 'v1.0',
   '{"input_table": "editorial_crm_opportunities", "conversion_rate_metric": "opportunity_win_rate", "horizon_months": 6}')
on conflict (code) do nothing;


-- ============================================================
-- 4. EDITORIAL FORECAST RUNS
-- ============================================================
-- A specific execution of a forecast model for a given period
-- and scope. Stores the run metadata; actual values in
-- editorial_forecast_values.
-- ============================================================

create table if not exists editorial_forecast_runs (
  id                      uuid          primary key default gen_random_uuid(),

  model_id                uuid          not null
                            references editorial_forecast_models(id) on delete cascade,

  forecast_period_start   date          not null,
  forecast_period_end     date          not null,

  -- The date this run was executed
  run_date                date          not null,

  -- Scope of this particular run
  scope_type              text          not null default 'global'
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project',
                              'client_account',
                              'sales_pipeline',
                              'distribution',
                              'other'
                            )),

  scope_id                uuid,

  -- Run lifecycle
  status                  text          not null default 'draft'
                            check (status in (
                              'draft',
                              'completed',
                              'superseded',
                              'cancelled'
                            )),

  -- Raw input data snapshot at run time
  input_payload           jsonb,

  -- Key assumptions used in this run
  assumptions             jsonb,

  -- Human-readable executive summary
  summary                 text,

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),

  -- period must be valid
  constraint chk_forecast_period check (forecast_period_end > forecast_period_start)
);

comment on table editorial_forecast_runs is
  'A specific forecast execution. Stores run metadata and scope; forecast output values are in editorial_forecast_values.';
comment on column editorial_forecast_runs.status is
  'draft → completed | superseded (when a newer run exists) | cancelled.';
comment on column editorial_forecast_runs.assumptions is
  'JSONB listing key assumptions, e.g. {growth_rate: 0.05, churn_rate: 0.02, seasonal_factor: 1.1}.';

create index if not exists idx_forecast_runs_model
  on editorial_forecast_runs(model_id);

create index if not exists idx_forecast_runs_period_start
  on editorial_forecast_runs(forecast_period_start);

create index if not exists idx_forecast_runs_period_end
  on editorial_forecast_runs(forecast_period_end);

create index if not exists idx_forecast_runs_run_date
  on editorial_forecast_runs(run_date desc);

create index if not exists idx_forecast_runs_scope_type
  on editorial_forecast_runs(scope_type);

create index if not exists idx_forecast_runs_scope_id
  on editorial_forecast_runs(scope_id)
  where scope_id is not null;

create index if not exists idx_forecast_runs_status
  on editorial_forecast_runs(status);

-- Latest completed run per model
create index if not exists idx_forecast_runs_model_status_date
  on editorial_forecast_runs(model_id, status, run_date desc)
  where status = 'completed';


-- ============================================================
-- 5. EDITORIAL FORECAST VALUES
-- ============================================================
-- Detailed output rows from a forecast run. One row per
-- (run, metric_code, period_date, dimension_key).
-- ============================================================

create table if not exists editorial_forecast_values (
  id                      uuid          primary key default gen_random_uuid(),

  forecast_run_id         uuid          not null
                            references editorial_forecast_runs(id) on delete cascade,

  -- Metric being forecasted (references metric_definitions.code — no FK for flexibility)
  metric_code             text          not null,

  -- Optional breakdown dimension (e.g. 'department:editorial', 'channel:amazon_kdp')
  dimension_key           text,

  -- The specific period date this value applies to
  period_date             date          not null,

  -- Forecast output
  predicted_value         numeric,
  low_estimate            numeric,
  high_estimate           numeric,

  -- Model confidence [0.0–1.0]
  confidence_score        numeric       check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),

  notes                   text,

  created_at              timestamptz   not null default now()
);

comment on table editorial_forecast_values is
  'Detailed forecast output per run. One row per (run, metric, date, dimension). References metric_code as text for schema flexibility.';
comment on column editorial_forecast_values.dimension_key is
  'Optional breakdown key, e.g. "department:design", "channel:amazon_kdp", "staff_profile_id:uuid".';
comment on column editorial_forecast_values.confidence_score is
  'Model confidence [0.0, 1.0]. NULL if confidence is not computed for this method.';

create index if not exists idx_forecast_values_run
  on editorial_forecast_values(forecast_run_id);

create index if not exists idx_forecast_values_metric
  on editorial_forecast_values(metric_code);

create index if not exists idx_forecast_values_date
  on editorial_forecast_values(period_date);

create index if not exists idx_forecast_values_dimension
  on editorial_forecast_values(dimension_key)
  where dimension_key is not null;

create index if not exists idx_forecast_values_run_metric_date
  on editorial_forecast_values(forecast_run_id, metric_code, period_date);


-- ============================================================
-- 6. EDITORIAL SCORECARDS
-- ============================================================
-- Reusable scorecard definitions (executive, department, sales,
-- finance, operations). Configured via JSONB to allow flexible
-- metric weighting and visual layout without schema changes.
-- ============================================================

create table if not exists editorial_scorecards (
  id                      uuid          primary key default gen_random_uuid(),

  code                    text          not null unique,

  name                    text          not null,
  description             text,

  -- What kind of scorecard this is
  scorecard_type          text          not null
                            check (scorecard_type in (
                              'executive',
                              'department',
                              'staff',
                              'project_portfolio',
                              'sales',
                              'finance',
                              'operations',
                              'distribution',
                              'custom'
                            )),

  -- What scope this scorecard applies to
  scope_type              text          not null
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project',
                              'client_account',
                              'other'
                            )),

  active                  boolean       not null default true,

  -- Scorecard layout and metric weights
  -- {components: [{metric_code, weight, threshold_warning, threshold_critical, display_name}]}
  configuration           jsonb         not null default '{}',

  created_by              uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_scorecards is
  'Reusable scorecard definitions. Flexible metric composition and weights via configuration JSONB.';
comment on column editorial_scorecards.configuration is
  'Scorecard layout: {components: [{metric_code, weight, threshold_warning, threshold_critical, display_name, invert_direction}]}.';

create index if not exists idx_scorecards_type
  on editorial_scorecards(scorecard_type);

create index if not exists idx_scorecards_scope
  on editorial_scorecards(scope_type);

create index if not exists idx_scorecards_active
  on editorial_scorecards(active)
  where active = true;


-- ── Seed: default scorecards ───────────────────────────────────────────────

insert into editorial_scorecards
  (code, name, description, scorecard_type, scope_type, configuration)
values
  ('executive_health',
   'Executive Health Scorecard',
   'Top-level executive scorecard combining key operational, financial, and sales metrics',
   'executive', 'global',
   '{"components": [
     {"metric_code": "active_projects_count",       "weight": 0.15, "display_name": "Active Projects"},
     {"metric_code": "monthly_pipeline_value",       "weight": 0.20, "display_name": "Pipeline Value"},
     {"metric_code": "monthly_collected_amount",     "weight": 0.20, "display_name": "Collections"},
     {"metric_code": "opportunity_win_rate",         "weight": 0.20, "display_name": "Win Rate"},
     {"metric_code": "sla_breach_count",             "weight": 0.15, "display_name": "SLA Breaches", "invert_direction": true},
     {"metric_code": "gross_margin_estimate",        "weight": 0.10, "display_name": "Gross Margin"}
   ]}'),

  ('sales_performance',
   'Sales Performance Scorecard',
   'Sales team scorecard tracking pipeline, conversion, and quote metrics',
   'sales', 'global',
   '{"components": [
     {"metric_code": "lead_to_opportunity_rate",     "weight": 0.25, "display_name": "Lead → Opportunity"},
     {"metric_code": "opportunity_win_rate",          "weight": 0.35, "display_name": "Opportunity Win Rate"},
     {"metric_code": "quote_acceptance_rate",         "weight": 0.25, "display_name": "Quote Acceptance"},
     {"metric_code": "monthly_pipeline_value",        "weight": 0.15, "display_name": "Pipeline Value"}
   ]}'),

  ('operations_health',
   'Operations Health Scorecard',
   'Operational scorecard tracking tasks, SLAs, workload, and project throughput',
   'operations', 'global',
   '{"components": [
     {"metric_code": "open_tasks_count",             "weight": 0.30, "display_name": "Open Tasks",       "invert_direction": true},
     {"metric_code": "sla_breach_count",             "weight": 0.40, "display_name": "SLA Breaches",     "invert_direction": true},
     {"metric_code": "active_projects_count",         "weight": 0.15, "display_name": "Active Projects"},
     {"metric_code": "marketplace_orders_count",      "weight": 0.15, "display_name": "Marketplace Orders"}
   ]}'),

  ('finance_health',
   'Finance Health Scorecard',
   'Financial health scorecard tracking invoiced amounts, collections, and margin',
   'finance', 'global',
   '{"components": [
     {"metric_code": "monthly_invoiced_amount",       "weight": 0.30, "display_name": "Invoiced"},
     {"metric_code": "monthly_collected_amount",      "weight": 0.35, "display_name": "Collected"},
     {"metric_code": "gross_margin_estimate",         "weight": 0.35, "display_name": "Gross Margin"}
   ]}')
on conflict (code) do nothing;


-- ============================================================
-- 7. EDITORIAL SCORECARD RESULTS
-- ============================================================
-- Calculated scorecard results for a given date and scope.
-- One row per (scorecard, date, scope_id).
-- Generated by scheduled jobs.
-- ============================================================

create table if not exists editorial_scorecard_results (
  id                      uuid          primary key default gen_random_uuid(),

  scorecard_id            uuid          not null
                            references editorial_scorecards(id) on delete cascade,

  result_date             date          not null,

  -- The specific scope entity this result is for (NULL for global)
  scope_id                uuid,

  -- Composite weighted score [0–100]
  overall_score           numeric       check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),

  -- Derived status band
  status                  text          not null default 'normal'
                            check (status in (
                              'excellent',
                              'good',
                              'normal',
                              'warning',
                              'critical'
                            )),

  -- Executive summary text for this result
  summary                 text,

  -- Per-component scores: [{metric_code, value, score, status}]
  component_scores        jsonb,

  -- Auto-generated recommendations for this scorecard result
  recommendations         jsonb,

  created_at              timestamptz   not null default now()
);

comment on table editorial_scorecard_results is
  'Calculated scorecard results per date and scope. One row per (scorecard, date, scope). Generated by scheduled jobs.';
comment on column editorial_scorecard_results.overall_score is
  'Weighted composite score 0–100.';
comment on column editorial_scorecard_results.component_scores is
  'Per-component breakdown: [{metric_code, raw_value, normalized_score, status, weight}].';

create index if not exists idx_scorecard_results_scorecard
  on editorial_scorecard_results(scorecard_id);

create index if not exists idx_scorecard_results_date
  on editorial_scorecard_results(result_date desc);

create index if not exists idx_scorecard_results_scope
  on editorial_scorecard_results(scope_id)
  where scope_id is not null;

create index if not exists idx_scorecard_results_status
  on editorial_scorecard_results(status);

create index if not exists idx_scorecard_results_scorecard_date
  on editorial_scorecard_results(scorecard_id, result_date desc);


-- ============================================================
-- 8. EDITORIAL TREND ANALYSES
-- ============================================================
-- Stores detected trend summaries for metrics over time.
-- Generated by scheduled jobs that compare current vs baseline.
-- ============================================================

create table if not exists editorial_trend_analyses (
  id                      uuid          primary key default gen_random_uuid(),

  metric_definition_id    uuid
                            references editorial_metric_definitions(id) on delete set null,

  analysis_date           date          not null,

  -- Scope this trend is computed for
  scope_type              text          not null
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project',
                              'client_account',
                              'channel',
                              'other'
                            )),

  scope_id                uuid,

  -- Detected trend direction
  trend_direction         text          not null
                            check (trend_direction in (
                              'up',
                              'down',
                              'flat',
                              'volatile',
                              'seasonal',
                              'insufficient_data'
                            )),

  -- Quantified change
  change_percent          numeric,
  baseline_value          numeric,
  current_value           numeric,

  -- Human-readable summary
  summary                 text,

  -- Supporting data (period used, data points, confidence, etc.)
  details                 jsonb,

  created_at              timestamptz   not null default now()
);

comment on table editorial_trend_analyses is
  'Detected metric trend summaries. Generated by scheduled jobs comparing current vs. baseline period values.';
comment on column editorial_trend_analyses.trend_direction is
  'up | down | flat | volatile | seasonal | insufficient_data.';
comment on column editorial_trend_analyses.details is
  'Supporting details: {look_back_days, data_points, r_squared, baseline_period, comparison_period}.';

create index if not exists idx_trend_analyses_metric
  on editorial_trend_analyses(metric_definition_id);

create index if not exists idx_trend_analyses_date
  on editorial_trend_analyses(analysis_date desc);

create index if not exists idx_trend_analyses_scope_type
  on editorial_trend_analyses(scope_type);

create index if not exists idx_trend_analyses_scope_id
  on editorial_trend_analyses(scope_id)
  where scope_id is not null;

create index if not exists idx_trend_analyses_direction
  on editorial_trend_analyses(trend_direction);

create index if not exists idx_trend_analyses_metric_date
  on editorial_trend_analyses(metric_definition_id, analysis_date desc)
  where metric_definition_id is not null;


-- ============================================================
-- 9. EDITORIAL ANOMALY SIGNALS
-- ============================================================
-- Detected anomalies or unusual metric conditions.
-- Supports an acknowledge-resolve workflow.
-- Can be linked to a project for operational context.
-- ============================================================

create table if not exists editorial_anomaly_signals (
  id                      uuid          primary key default gen_random_uuid(),

  -- The metric that produced this anomaly
  metric_definition_id    uuid
                            references editorial_metric_definitions(id) on delete set null,

  -- Optional operational context
  related_project_id      uuid
                            references editorial_projects(id) on delete set null,

  signal_date             date          not null,

  -- Scope of the anomaly
  scope_type              text          not null
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project',
                              'client_account',
                              'channel',
                              'other'
                            )),

  scope_id                uuid,

  -- Classification
  severity                text          not null
                            check (severity in ('info', 'warning', 'error', 'critical')),

  -- Machine-readable anomaly type (e.g. 'spike', 'drop', 'threshold_breach', 'missing_data')
  signal_type             text          not null,

  -- Statistical context
  expected_value          numeric,
  actual_value            numeric,
  deviation_percent       numeric,

  title                   text          not null,
  description             text,
  recommended_action      text,

  -- Resolution lifecycle
  status                  text          not null default 'open'
                            check (status in (
                              'open',
                              'acknowledged',
                              'resolved',
                              'ignored'
                            )),

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_anomaly_signals is
  'Detected metric anomalies and unusual conditions. Supports acknowledge-resolve workflow.';
comment on column editorial_anomaly_signals.signal_type is
  'Machine-readable type, e.g. "spike", "drop", "threshold_breach", "zero_value", "missing_data".';
comment on column editorial_anomaly_signals.deviation_percent is
  'Deviation from expected: ((actual - expected) / expected) * 100.';

create index if not exists idx_anomaly_signals_metric
  on editorial_anomaly_signals(metric_definition_id);

create index if not exists idx_anomaly_signals_project
  on editorial_anomaly_signals(related_project_id)
  where related_project_id is not null;

create index if not exists idx_anomaly_signals_date
  on editorial_anomaly_signals(signal_date desc);

create index if not exists idx_anomaly_signals_scope_type
  on editorial_anomaly_signals(scope_type);

create index if not exists idx_anomaly_signals_scope_id
  on editorial_anomaly_signals(scope_id)
  where scope_id is not null;

create index if not exists idx_anomaly_signals_severity
  on editorial_anomaly_signals(severity);

create index if not exists idx_anomaly_signals_status
  on editorial_anomaly_signals(status);

-- Fast open anomaly dashboard query
create index if not exists idx_anomaly_signals_open_severity
  on editorial_anomaly_signals(status, severity)
  where status in ('open', 'acknowledged');


-- ============================================================
-- 10. EDITORIAL EXECUTIVE REPORTS
-- ============================================================
-- Generated executive reporting records. Each row represents
-- a compiled executive report (weekly, monthly, quarterly, etc.)
-- with highlights, risks, opportunities, and recommendations.
-- ============================================================

create table if not exists editorial_executive_reports (
  id                      uuid          primary key default gen_random_uuid(),

  -- Unique human-readable report code (e.g. 'EXEC-2025-Q1')
  report_code             text          not null unique,

  title                   text          not null,

  -- Report category
  report_type             text          not null
                            check (report_type in (
                              'weekly_exec',
                              'monthly_exec',
                              'quarterly_exec',
                              'sales_review',
                              'finance_review',
                              'operations_review',
                              'distribution_review',
                              'custom'
                            )),

  -- The period this report covers
  reporting_period_start  date          not null,
  reporting_period_end    date          not null,

  -- Scope of the report
  scope_type              text          not null default 'global'
                            check (scope_type in (
                              'global',
                              'department',
                              'staff',
                              'project_portfolio',
                              'client_segment',
                              'other'
                            )),

  scope_id                uuid,

  -- Report lifecycle
  status                  text          not null default 'draft'
                            check (status in (
                              'draft',
                              'published',
                              'archived'
                            )),

  -- Report content sections (stored as JSONB for flexibility)
  summary                 text,
  highlights              jsonb,        -- [{title, metric_code, value, change_percent, status}]
  risks                   jsonb,        -- [{title, description, severity, related_anomaly_id}]
  opportunities           jsonb,        -- [{title, description, estimated_value, domain}]
  recommendations         jsonb,        -- [{title, action, priority, domain}]

  generated_by            uuid          references auth.users(id) on delete set null,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),

  constraint chk_exec_report_period check (reporting_period_end >= reporting_period_start)
);

comment on table editorial_executive_reports is
  'Generated executive reports. Each row is a compiled report with highlights, risks, opportunities, and recommendations.';
comment on column editorial_executive_reports.report_code is
  'Human-readable identifier, e.g. "EXEC-2025-Q1", "SALES-2025-03", "OPS-WEEKLY-2025-W12".';
comment on column editorial_executive_reports.highlights is
  'Array of key metrics: [{title, metric_code, value, change_percent, status}].';

create index if not exists idx_exec_reports_type
  on editorial_executive_reports(report_type);

create index if not exists idx_exec_reports_period_start
  on editorial_executive_reports(reporting_period_start desc);

create index if not exists idx_exec_reports_period_end
  on editorial_executive_reports(reporting_period_end desc);

create index if not exists idx_exec_reports_scope_type
  on editorial_executive_reports(scope_type);

create index if not exists idx_exec_reports_scope_id
  on editorial_executive_reports(scope_id)
  where scope_id is not null;

create index if not exists idx_exec_reports_status
  on editorial_executive_reports(status);

-- Latest published reports by type
create index if not exists idx_exec_reports_type_status_date
  on editorial_executive_reports(report_type, status, reporting_period_end desc)
  where status = 'published';


-- ============================================================
-- 11. EDITORIAL RECOMMENDATION SIGNALS
-- ============================================================
-- AI-assisted or rule-based strategic recommendations.
-- Can be linked to specific projects, opportunities, or client accounts.
-- Supports a reviewing → accepted/rejected → implemented workflow.
-- ============================================================

create table if not exists editorial_recommendation_signals (
  id                      uuid          primary key default gen_random_uuid(),

  -- Machine-readable recommendation type (e.g. 'upsell_opportunity', 'at_risk_client')
  recommendation_type     text          not null,

  -- Business domain this recommendation applies to
  domain                  text          not null
                            check (domain in (
                              'sales',
                              'finance',
                              'operations',
                              'distribution',
                              'quality',
                              'customer_success',
                              'executive'
                            )),

  -- Optional operational context
  related_project_id      uuid
                            references editorial_projects(id) on delete set null,

  related_opportunity_id  uuid
                            references editorial_crm_opportunities(id) on delete set null,

  related_client_account_id uuid
                            references editorial_client_accounts(id) on delete set null,

  -- Urgency and lifecycle
  priority                text          not null default 'medium'
                            check (priority in ('low', 'medium', 'high', 'urgent')),

  status                  text          not null default 'open'
                            check (status in (
                              'open',
                              'reviewing',
                              'accepted',
                              'rejected',
                              'implemented',
                              'archived'
                            )),

  -- Content
  title                   text          not null,
  description             text          not null,
  expected_impact         text,
  recommended_action      text,

  -- Model output
  confidence_score        numeric       check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),

  -- How this recommendation was generated
  source_type             text          not null default 'rule_based'
                            check (source_type in (
                              'rule_based',
                              'ai_generated',
                              'hybrid',
                              'manual'
                            )),

  -- Supporting data used to generate this recommendation
  supporting_data         jsonb,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on table editorial_recommendation_signals is
  'AI-assisted and rule-based strategic recommendations. Supports reviewing → accepted/rejected → implemented workflow.';
comment on column editorial_recommendation_signals.recommendation_type is
  'Machine-readable type, e.g. "upsell_opportunity", "at_risk_client", "sla_risk", "capacity_alert".';
comment on column editorial_recommendation_signals.confidence_score is
  'Model confidence [0.0, 1.0]. NULL for rule-based or manual recommendations.';
comment on column editorial_recommendation_signals.supporting_data is
  'Data used to derive the recommendation, e.g. {metric_code, anomaly_id, trend_id, rationale}.';

create index if not exists idx_rec_signals_type
  on editorial_recommendation_signals(recommendation_type);

create index if not exists idx_rec_signals_domain
  on editorial_recommendation_signals(domain);

create index if not exists idx_rec_signals_project
  on editorial_recommendation_signals(related_project_id)
  where related_project_id is not null;

create index if not exists idx_rec_signals_opportunity
  on editorial_recommendation_signals(related_opportunity_id)
  where related_opportunity_id is not null;

create index if not exists idx_rec_signals_account
  on editorial_recommendation_signals(related_client_account_id)
  where related_client_account_id is not null;

create index if not exists idx_rec_signals_priority
  on editorial_recommendation_signals(priority);

create index if not exists idx_rec_signals_status
  on editorial_recommendation_signals(status);

-- Fast open recommendations dashboard
create index if not exists idx_rec_signals_open_priority
  on editorial_recommendation_signals(status, priority)
  where status in ('open', 'reviewing');


-- ============================================================
-- 12. EDITORIAL INTELLIGENCE EVENTS
-- ============================================================
-- Immutable audit trail for analytics, forecasting, and
-- intelligence generation operations.
-- Written by application code / service-role only.
-- ============================================================

create table if not exists editorial_intelligence_events (
  id                      uuid          primary key default gen_random_uuid(),

  -- Event classification
  event_type              text          not null,

  -- Entity type this event relates to
  entity_type             text          not null,

  -- The specific entity ID (e.g. forecast_run.id, scorecard_result.id)
  entity_id               uuid,

  -- Actor who triggered this (NULL = automated job)
  actor_user_id           uuid          references auth.users(id) on delete set null,

  summary                 text          not null,
  payload                 jsonb,

  created_at              timestamptz   not null default now()
);

comment on table editorial_intelligence_events is
  'Immutable audit trail for analytics, forecasting, and intelligence generation operations. Service-role writes only.';
comment on column editorial_intelligence_events.event_type is
  'e.g. "forecast_run_completed", "anomaly_detected", "scorecard_generated", "report_published", "recommendation_created".';
comment on column editorial_intelligence_events.entity_type is
  'e.g. "forecast_run", "metric_snapshot", "scorecard_result", "anomaly_signal", "executive_report".';
comment on column editorial_intelligence_events.actor_user_id is
  'NULL when triggered by a scheduled job or automated analytical pipeline.';

create index if not exists idx_intel_events_type
  on editorial_intelligence_events(event_type);

create index if not exists idx_intel_events_entity_type
  on editorial_intelligence_events(entity_type);

create index if not exists idx_intel_events_entity_id
  on editorial_intelligence_events(entity_id)
  where entity_id is not null;

create index if not exists idx_intel_events_actor
  on editorial_intelligence_events(actor_user_id)
  where actor_user_id is not null;

create index if not exists idx_intel_events_created
  on editorial_intelligence_events(created_at desc);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Staff (superadmin, admin, ops) can read all analytics/intelligence tables.
--   2. Analytics data is internal by default — no public read access.
--   3. Metric snapshot, scorecard result, forecast run, and intelligence event
--      writes are service-role / admin only (generated by scheduled jobs).
--   4. Recommendation signals can be read and updated by authorized staff.
--   5. Executive reports are admin/leadership read; published ones are staff-readable.
--   6. Anomaly signals support a staff-visible acknowledge/resolve flow.
-- =============================================================================

alter table editorial_metric_definitions       enable row level security;
alter table editorial_metric_snapshots         enable row level security;
alter table editorial_forecast_models          enable row level security;
alter table editorial_forecast_runs            enable row level security;
alter table editorial_forecast_values          enable row level security;
alter table editorial_scorecards               enable row level security;
alter table editorial_scorecard_results        enable row level security;
alter table editorial_trend_analyses           enable row level security;
alter table editorial_anomaly_signals          enable row level security;
alter table editorial_executive_reports        enable row level security;
alter table editorial_recommendation_signals   enable row level security;
alter table editorial_intelligence_events      enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_metric_definitions (reference data)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read metric definitions"   on editorial_metric_definitions;
create policy "staff read metric definitions"
  on editorial_metric_definitions
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin manage metric definitions"  on editorial_metric_definitions;
create policy "admin manage metric definitions"
  on editorial_metric_definitions
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_metric_snapshots (service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read metric snapshots"  on editorial_metric_snapshots;
create policy "staff read metric snapshots"
  on editorial_metric_snapshots
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only (scheduled jobs).


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_forecast_models
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read forecast models"   on editorial_forecast_models;
create policy "staff read forecast models"
  on editorial_forecast_models
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin manage forecast models"  on editorial_forecast_models;
create policy "admin manage forecast models"
  on editorial_forecast_models
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_forecast_runs
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read forecast runs"  on editorial_forecast_runs;
create policy "staff read forecast runs"
  on editorial_forecast_runs
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin write forecast runs"  on editorial_forecast_runs;
create policy "admin write forecast runs"
  on editorial_forecast_runs
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_forecast_values (service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read forecast values"  on editorial_forecast_values;
create policy "staff read forecast values"
  on editorial_forecast_values
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_scorecards
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read scorecards"    on editorial_scorecards;
create policy "staff read scorecards"
  on editorial_scorecards
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

drop policy if exists "admin manage scorecards"  on editorial_scorecards;
create policy "admin manage scorecards"
  on editorial_scorecards
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_scorecard_results (service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read scorecard results"  on editorial_scorecard_results;
create policy "staff read scorecard results"
  on editorial_scorecard_results
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_trend_analyses (service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read trend analyses"  on editorial_trend_analyses;
create policy "staff read trend analyses"
  on editorial_trend_analyses
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 9: editorial_anomaly_signals
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read anomaly signals"   on editorial_anomaly_signals;
create policy "staff read anomaly signals"
  on editorial_anomaly_signals
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Staff can acknowledge and resolve anomalies
drop policy if exists "staff update anomaly signals"  on editorial_anomaly_signals;
create policy "staff update anomaly signals"
  on editorial_anomaly_signals
  for update
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Inserts are service-role only (automated detection).


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 10: editorial_executive_reports
-- ────────────────────────────────────────────────────────────────────────────

-- Admin/leadership can read all reports
drop policy if exists "admin read executive reports"   on editorial_executive_reports;
create policy "admin read executive reports"
  on editorial_executive_reports
  for select
  using (public.get_my_role() in ('superadmin', 'admin'));

-- Staff (ops) can read published reports only
drop policy if exists "ops read published reports"     on editorial_executive_reports;
create policy "ops read published reports"
  on editorial_executive_reports
  for select
  using (
    public.get_my_role() = 'ops'
    and status = 'published'
  );

drop policy if exists "admin write executive reports"  on editorial_executive_reports;
create policy "admin write executive reports"
  on editorial_executive_reports
  for all
  using  (public.get_my_role() in ('superadmin', 'admin'))
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 11: editorial_recommendation_signals
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read recommendation signals"   on editorial_recommendation_signals;
create policy "staff read recommendation signals"
  on editorial_recommendation_signals
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Staff can update status (reviewing/accepted/rejected/implemented)
drop policy if exists "staff update recommendation signals" on editorial_recommendation_signals;
create policy "staff update recommendation signals"
  on editorial_recommendation_signals
  for update
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Admin can create manual recommendations
drop policy if exists "admin insert recommendation signals"  on editorial_recommendation_signals;
create policy "admin insert recommendation signals"
  on editorial_recommendation_signals
  for insert
  with check (public.get_my_role() in ('superadmin', 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 12: editorial_intelligence_events (audit trail — service-role writes)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff read intelligence events"  on editorial_intelligence_events;
create policy "staff read intelligence events"
  on editorial_intelligence_events
  for select
  using (public.get_my_role() in ('superadmin', 'admin', 'ops'));

-- Writes are service-role only.


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
