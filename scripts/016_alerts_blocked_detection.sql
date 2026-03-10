-- Reino Editorial AI Engine: Alerts + Blocked Detection – Phase 4A.3
-- Adds operational alerts table and blocked projects view.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_project_alerts
-- Operational alerts for staff operations (open|acknowledged|resolved).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  project_id      uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key       text NULL,
  alert_type      text NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  severity        text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  is_blocking     boolean NOT NULL DEFAULT false,
  title           text NOT NULL,
  message         text NOT NULL,
  details         jsonb NULL,
  dedupe_key      text NOT NULL,
  first_detected_at timestamptz DEFAULT now(),
  last_detected_at  timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz,
  acknowledged_at timestamptz NULL,
  acknowledged_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_at     timestamptz NULL,
  resolved_by     uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL
);

-- One alert row per project+dedupe_key (status changes update the same row).
CREATE UNIQUE INDEX IF NOT EXISTS uq_epa_project_dedupe
  ON editorial_project_alerts (project_id, dedupe_key);

CREATE INDEX IF NOT EXISTS idx_epa_org_status
  ON editorial_project_alerts (org_id, status);
CREATE INDEX IF NOT EXISTS idx_epa_project_status
  ON editorial_project_alerts (project_id, status);
CREATE INDEX IF NOT EXISTS idx_epa_type
  ON editorial_project_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_epa_blocking
  ON editorial_project_alerts (is_blocking);
CREATE INDEX IF NOT EXISTS idx_epa_last_detected
  ON editorial_project_alerts (last_detected_at DESC);

ALTER TABLE editorial_project_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_alerts' AND policyname = 'epa_service_all'
  ) THEN
    CREATE POLICY "epa_service_all" ON editorial_project_alerts
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Staff can read alerts for their org (best-effort, consistent with other staff policies).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_alerts' AND policyname = 'epa_staff_read'
  ) THEN
    CREATE POLICY "epa_staff_read" ON editorial_project_alerts
      FOR SELECT USING (
        org_id = public.get_my_org_id()
        AND public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_blocked_projects_view
-- Projects that currently have open blocking alerts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW editorial_blocked_projects_view AS
SELECT
  ep.org_id,
  ep.id AS project_id,
  ep.title,
  ep.author_name,
  ep.current_stage,
  ep.status AS project_status,
  ep.due_date,
  COALESCE(ep.updated_at, ep.created_at) AS project_last_activity_at,
  COUNT(*) FILTER (WHERE epa.status = 'open' AND epa.is_blocking) ::int AS blocking_alerts_count,
  COUNT(*) FILTER (WHERE epa.status = 'open') ::int AS open_alerts_count,
  MAX(epa.last_detected_at) AS last_alert_at,
  ARRAY_AGG(DISTINCT epa.alert_type) FILTER (WHERE epa.status = 'open') AS open_alert_types
FROM editorial_projects ep
JOIN editorial_project_alerts epa
  ON epa.project_id = ep.id
WHERE epa.status = 'open' AND epa.is_blocking = true
GROUP BY ep.org_id, ep.id, ep.title, ep.author_name, ep.current_stage, ep.status, ep.due_date, ep.created_at, ep.updated_at;

