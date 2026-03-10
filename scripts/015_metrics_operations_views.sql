-- Reino Editorial AI Engine: Metrics + Operations Views – Phase 4A.4
-- Adds SQL views for operational dashboard. Read-only, safe to re-run.

-- ---------------------------------------------------------------------------
-- editorial_project_current_stage_view
-- One row per project with its current stage row + basic freshness info.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW editorial_project_current_stage_view AS
SELECT
  ep.org_id,
  ep.id AS project_id,
  ep.title,
  ep.author_name,
  ep.status AS project_status,
  ep.current_stage,
  ep.due_date,
  ep.created_at AS project_created_at,
  COALESCE(ep.updated_at, ep.created_at) AS project_last_activity_at,
  es.id AS stage_id,
  es.stage_key,
  es.status AS stage_status,
  es.started_at,
  es.completed_at,
  es.approved_at,
  es.approved_by
FROM editorial_projects ep
LEFT JOIN editorial_stages es
  ON es.project_id = ep.id
 AND es.stage_key = ep.current_stage;

-- ---------------------------------------------------------------------------
-- editorial_stage_metrics_view
-- Aggregates counts and basic timing metrics per org / stage_key / stage_status.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW editorial_stage_metrics_view AS
SELECT
  ep.org_id,
  es.stage_key,
  es.status AS stage_status,
  COUNT(*)::int AS stage_count,
  AVG(
    CASE
      WHEN es.started_at IS NOT NULL AND es.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (es.completed_at - es.started_at)) / 3600.0
      ELSE NULL
    END
  ) AS avg_duration_hours,
  MIN(es.created_at) AS oldest_stage_created_at,
  MAX(es.created_at) AS newest_stage_created_at
FROM editorial_stages es
JOIN editorial_projects ep ON ep.id = es.project_id
GROUP BY ep.org_id, es.stage_key, es.status;

-- ---------------------------------------------------------------------------
-- editorial_project_sla_view
-- Simple SLA projection based on due_date and recency.
-- - sla_state: none | on_track | at_risk | breached
-- - inactivity_state: ok | at_risk | critical
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW editorial_project_sla_view AS
SELECT
  v.org_id,
  v.project_id,
  v.title,
  v.project_status,
  v.current_stage,
  v.due_date,
  v.project_last_activity_at,
  (DATE(v.due_date) - CURRENT_DATE) AS days_to_due,
  (CURRENT_DATE - DATE(v.project_last_activity_at)) AS days_since_activity,
  CASE
    WHEN v.due_date IS NULL THEN 'none'
    WHEN v.due_date < NOW() THEN 'breached'
    WHEN v.due_date <= (NOW() + INTERVAL '7 days') THEN 'at_risk'
    ELSE 'on_track'
  END AS sla_state,
  CASE
    WHEN v.project_last_activity_at >= (NOW() - INTERVAL '14 days') THEN 'ok'
    WHEN v.project_last_activity_at >= (NOW() - INTERVAL '30 days') THEN 'at_risk'
    ELSE 'critical'
  END AS inactivity_state
FROM editorial_project_current_stage_view v;

-- ---------------------------------------------------------------------------
-- editorial_staff_workload_view
-- Workload summary per org / user / role (counts of assigned projects).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW editorial_staff_workload_view AS
SELECT
  ep.org_id,
  a.user_id,
  a.role,
  COUNT(*)::int AS assigned_projects_count,
  COUNT(*) FILTER (WHERE ep.status IN ('review', 'review_required'))::int AS review_queue_count,
  COUNT(*) FILTER (WHERE ep.status = 'in_progress')::int AS in_progress_count,
  COUNT(*) FILTER (WHERE ep.status = 'completed')::int AS completed_count,
  MIN(COALESCE(ep.updated_at, ep.created_at)) AS oldest_assigned_activity_at,
  MAX(COALESCE(ep.updated_at, ep.created_at)) AS newest_assigned_activity_at
FROM editorial_project_staff_assignments a
JOIN editorial_projects ep ON ep.id = a.project_id
GROUP BY ep.org_id, a.user_id, a.role;

