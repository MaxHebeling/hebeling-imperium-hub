-- Reino Editorial AI Engine: AI Findings Engine – Phase 4B.2
-- Adds structured storage for AI findings. Reuses editorial_jobs for job lifecycle.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_ai_findings
-- Normalized findings (issues, recommendations, quality flags) linked to a job.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_ai_findings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL,
  project_id       uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key        text NULL,
  ai_job_id        uuid NOT NULL REFERENCES editorial_jobs (id) ON DELETE CASCADE,
  source_file_id   uuid NULL REFERENCES editorial_files (id) ON DELETE SET NULL,

  finding_type     text NOT NULL, -- issue | recommendation | flag (validated at app layer)
  severity         text NOT NULL DEFAULT 'info', -- info | warning | critical (validated at app layer)
  status           text NOT NULL DEFAULT 'open', -- open | acknowledged | resolved | dismissed (validated at app layer)

  title            text NOT NULL,
  description      text NOT NULL,
  snippet          text NULL,
  reference        jsonb NULL, -- offsets, chapter, paragraph, etc.
  suggested_action text NULL,

  created_by       uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_eaif_project_stage ON editorial_ai_findings (project_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_eaif_project_status ON editorial_ai_findings (project_id, status);
CREATE INDEX IF NOT EXISTS idx_eaif_project_severity ON editorial_ai_findings (project_id, severity);
CREATE INDEX IF NOT EXISTS idx_eaif_ai_job_id ON editorial_ai_findings (ai_job_id);

ALTER TABLE editorial_ai_findings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_ai_findings' AND policyname = 'eaif_service_all'
  ) THEN
    CREATE POLICY "eaif_service_all" ON editorial_ai_findings
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

