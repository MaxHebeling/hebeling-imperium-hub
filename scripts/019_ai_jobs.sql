-- Reino Editorial AI Engine: AI Job Foundation – Phase 4B.1
-- Adds prompt templates for AI tasks. Reuses editorial_jobs for job lifecycle.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_ai_prompt_templates
-- Versioned prompt templates per org + stage + task.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_ai_prompt_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  stage_key    text NOT NULL,
  task_key     text NOT NULL,
  version      integer NOT NULL,
  prompt_text  text NOT NULL,
  output_schema jsonb NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_eapt_org_stage_task_version
  ON editorial_ai_prompt_templates (org_id, stage_key, task_key, version);

CREATE INDEX IF NOT EXISTS idx_eapt_org_stage_task_active
  ON editorial_ai_prompt_templates (org_id, stage_key, task_key, is_active);

ALTER TABLE editorial_ai_prompt_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_ai_prompt_templates' AND policyname = 'eapt_service_all'
  ) THEN
    CREATE POLICY "eapt_service_all" ON editorial_ai_prompt_templates
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

