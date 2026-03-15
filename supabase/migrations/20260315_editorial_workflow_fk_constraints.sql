-- Migration: Add FK constraints to editorial workflow tables
-- Ensures referential integrity when editorial projects are deleted.

-- 1. editorial_project_workflow → editorial_projects
ALTER TABLE editorial_project_workflow
  DROP CONSTRAINT IF EXISTS editorial_project_workflow_project_id_fkey;

ALTER TABLE editorial_project_workflow
  ADD CONSTRAINT editorial_project_workflow_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES editorial_projects(id)
    ON DELETE CASCADE;

-- 2. editorial_project_workflow_stages → editorial_projects
ALTER TABLE editorial_project_workflow_stages
  DROP CONSTRAINT IF EXISTS editorial_project_workflow_stages_project_id_fkey;

ALTER TABLE editorial_project_workflow_stages
  ADD CONSTRAINT editorial_project_workflow_stages_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES editorial_projects(id)
    ON DELETE CASCADE;

-- 3. editorial_notifications → editorial_projects (if that table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'editorial_notifications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'editorial_notifications_project_id_fkey'
    ) THEN
      ALTER TABLE editorial_notifications
        ADD CONSTRAINT editorial_notifications_project_id_fkey
          FOREIGN KEY (project_id)
          REFERENCES editorial_projects(id)
          ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 4. client_editorial_timeline → editorial_projects (if that table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'client_editorial_timeline') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'client_editorial_timeline_project_id_fkey'
    ) THEN
      ALTER TABLE client_editorial_timeline
        ADD CONSTRAINT client_editorial_timeline_project_id_fkey
          FOREIGN KEY (project_id)
          REFERENCES editorial_projects(id)
          ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
