-- Reino Editorial AI Engine: AI Suggestions & Revisions (Modo B v1)
-- Safe to run multiple times (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- editorial_ai_suggestions: atomic text-level suggestions from AI agents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES editorial_jobs (id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES editorial_files (id) ON DELETE CASCADE,
  file_version integer NOT NULL,
  task_key text NOT NULL,
  kind text NOT NULL,
  severity text NOT NULL,
  confidence numeric(3,2) NOT NULL,
  location jsonb NOT NULL,
  original_text text NOT NULL,
  suggested_text text NOT NULL,
  justification text NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  validated_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eas_project_file
  ON editorial_ai_suggestions (project_id, file_id);

CREATE INDEX IF NOT EXISTS idx_eas_job
  ON editorial_ai_suggestions (job_id);

CREATE INDEX IF NOT EXISTS idx_eas_task_severity
  ON editorial_ai_suggestions (task_key, severity);

-- ---------------------------------------------------------------------------
-- editorial_ai_revisions: consolidated application of AI suggestions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_ai_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  source_file_id uuid NOT NULL REFERENCES editorial_files (id) ON DELETE CASCADE,
  source_file_version integer NOT NULL,
  result_file_id uuid NOT NULL REFERENCES editorial_files (id) ON DELETE CASCADE,
  result_file_version integer NOT NULL,
  applied_suggestions uuid[] NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft | validated | rejected
  applied_by uuid,
  applied_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ear_project
  ON editorial_ai_revisions (project_id);

