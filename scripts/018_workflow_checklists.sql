-- Reino Editorial AI Engine: Workflow Checklists – Phase 4A (BLOCK 2)
-- Adds checklist templates per stage and project-stage checklist instances.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_stage_checklist_templates
-- Checklist templates per org + stage.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_stage_checklist_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  stage_key    text NOT NULL,
  name         text NOT NULL,
  description  text NULL,
  is_required  boolean NOT NULL DEFAULT true,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_esct_org_stage_active
  ON editorial_stage_checklist_templates (org_id, stage_key, is_active);

ALTER TABLE editorial_stage_checklist_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_stage_checklist_templates' AND policyname = 'esct_service_all'
  ) THEN
    CREATE POLICY "esct_service_all" ON editorial_stage_checklist_templates
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_stage_checklist_template_items
-- Items belonging to a checklist template.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_stage_checklist_template_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id        uuid NOT NULL REFERENCES editorial_stage_checklist_templates (id) ON DELETE CASCADE,
  item_key           text NOT NULL,
  label              text NOT NULL,
  description        text NULL,
  sort_order         integer NOT NULL DEFAULT 0,
  is_required        boolean NOT NULL DEFAULT true,
  requires_file      boolean NOT NULL DEFAULT false,
  required_file_types text[] NULL,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_escti_template_sort
  ON editorial_stage_checklist_template_items (template_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_escti_template_item_key
  ON editorial_stage_checklist_template_items (template_id, item_key);

ALTER TABLE editorial_stage_checklist_template_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_stage_checklist_template_items' AND policyname = 'escti_service_all'
  ) THEN
    CREATE POLICY "escti_service_all" ON editorial_stage_checklist_template_items
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_project_stage_checklists
-- One checklist instance per project + stage (when a template exists).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_stage_checklists (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key        text NOT NULL,
  template_id      uuid NULL REFERENCES editorial_stage_checklist_templates (id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  progress_percent integer NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz,
  completed_at     timestamptz NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_epscl_project_stage
  ON editorial_project_stage_checklists (project_id, stage_key);

CREATE INDEX IF NOT EXISTS idx_epscl_project
  ON editorial_project_stage_checklists (project_id);

ALTER TABLE editorial_project_stage_checklists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_stage_checklists' AND policyname = 'epscl_service_all'
  ) THEN
    CREATE POLICY "epscl_service_all" ON editorial_project_stage_checklists
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_project_stage_checklist_items
-- Concrete checklist items per project-stage checklist.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_stage_checklist_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id       uuid NOT NULL REFERENCES editorial_project_stage_checklists (id) ON DELETE CASCADE,
  template_item_id   uuid NULL REFERENCES editorial_stage_checklist_template_items (id) ON DELETE SET NULL,
  item_key           text NOT NULL,
  label              text NOT NULL,
  sort_order         integer NOT NULL DEFAULT 0,
  is_required        boolean NOT NULL DEFAULT true,
  requires_file      boolean NOT NULL DEFAULT false,
  required_file_types text[] NULL,
  is_completed       boolean NOT NULL DEFAULT false,
  completed_at       timestamptz NULL,
  completed_by       uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_epscli_checklist_sort
  ON editorial_project_stage_checklist_items (checklist_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_epscli_checklist_completed
  ON editorial_project_stage_checklist_items (checklist_id, is_completed);

CREATE UNIQUE INDEX IF NOT EXISTS uq_epscli_checklist_item_key
  ON editorial_project_stage_checklist_items (checklist_id, item_key);

ALTER TABLE editorial_project_stage_checklist_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_stage_checklist_items' AND policyname = 'epscli_service_all'
  ) THEN
    CREATE POLICY "epscli_service_all" ON editorial_project_stage_checklist_items
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

