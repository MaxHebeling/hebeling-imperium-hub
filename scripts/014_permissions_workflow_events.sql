-- Reino Editorial AI Engine: Permissions + Workflow Events – Phase 4A.2
-- Adds per-project capabilities and structured workflow events.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_project_role_capabilities
-- Default capabilities per project role (manager/editor/reviewer/proofreader/designer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_role_capabilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  role        text NOT NULL CHECK (role IN ('manager', 'editor', 'reviewer', 'proofreader', 'designer')),
  capabilities text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_eprc_org_role
  ON editorial_project_role_capabilities (org_id, role);

ALTER TABLE editorial_project_role_capabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_role_capabilities' AND policyname = 'eprc_service_all'
  ) THEN
    CREATE POLICY "eprc_service_all" ON editorial_project_role_capabilities
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Staff can read default caps for their org.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_role_capabilities' AND policyname = 'eprc_staff_read'
  ) THEN
    CREATE POLICY "eprc_staff_read" ON editorial_project_role_capabilities
      FOR SELECT USING (
        org_id = public.get_my_org_id()
        AND public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_project_user_capabilities
-- Per-project per-user capability overrides (allow/deny sets).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_user_capabilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  allow       text[] NOT NULL DEFAULT '{}',
  deny        text[] NOT NULL DEFAULT '{}',
  reason      text NULL,
  created_by  uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_epuc_project_user
  ON editorial_project_user_capabilities (project_id, user_id);

ALTER TABLE editorial_project_user_capabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_user_capabilities' AND policyname = 'epuc_service_all'
  ) THEN
    CREATE POLICY "epuc_service_all" ON editorial_project_user_capabilities
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Staff can read overrides for projects in their org.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_user_capabilities' AND policyname = 'epuc_staff_read'
  ) THEN
    CREATE POLICY "epuc_staff_read" ON editorial_project_user_capabilities
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM editorial_projects ep
          WHERE ep.id = project_id
            AND ep.org_id = public.get_my_org_id()
            AND public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_workflow_events
-- Structured events for operational logic (keeps editorial_activity_log as human audit).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_workflow_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  project_id  uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key   text NULL,
  event_type  text NOT NULL,
  actor_id    uuid NULL,
  actor_role  text NULL,
  payload     jsonb NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ewe_project_id ON editorial_workflow_events (project_id);
CREATE INDEX IF NOT EXISTS idx_ewe_stage_key ON editorial_workflow_events (stage_key);
CREATE INDEX IF NOT EXISTS idx_ewe_event_type ON editorial_workflow_events (event_type);
CREATE INDEX IF NOT EXISTS idx_ewe_created_at ON editorial_workflow_events (created_at DESC);

ALTER TABLE editorial_workflow_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_workflow_events' AND policyname = 'ewe_service_all'
  ) THEN
    CREATE POLICY "ewe_service_all" ON editorial_workflow_events
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_workflow_events' AND policyname = 'ewe_staff_read'
  ) THEN
    CREATE POLICY "ewe_staff_read" ON editorial_workflow_events
      FOR SELECT USING (
        org_id = public.get_my_org_id()
        AND public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
      );
  END IF;
END $$;

