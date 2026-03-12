-- Reino Editorial AI Engine: Staff Assignments – Phase 3B
-- Adds a formal staff assignment model for editorial projects.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_project_staff_assignments
-- Roles: manager | editor | reviewer | proofreader | designer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_staff_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('manager', 'editor', 'reviewer', 'proofreader', 'designer')),
  assigned_by  uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  assigned_at  timestamptz DEFAULT now(),
  UNIQUE (project_id, role) -- one assignee per role for now (MVP)
);

COMMENT ON TABLE editorial_project_staff_assignments IS
  'Formal staff assignments per project. One user per role (manager/editor/reviewer/proofreader/designer).';

CREATE INDEX IF NOT EXISTS idx_epsa_project_id ON editorial_project_staff_assignments (project_id);
CREATE INDEX IF NOT EXISTS idx_epsa_user_id ON editorial_project_staff_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_epsa_role ON editorial_project_staff_assignments (role);

ALTER TABLE editorial_project_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Service role can manage all assignments.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_staff_assignments' AND policyname = 'epsa_service_all'
  ) THEN
    CREATE POLICY "epsa_service_all" ON editorial_project_staff_assignments
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Staff can read assignments for projects in their org (best-effort).
-- This relies on editorial_projects having org_id and profiles having org_id + role.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_staff_assignments' AND policyname = 'epsa_staff_read'
  ) THEN
    CREATE POLICY "epsa_staff_read" ON editorial_project_staff_assignments
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

