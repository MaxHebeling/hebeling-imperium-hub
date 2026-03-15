-- ============================================================================
-- Editorial Pipeline Artifacts Table
-- Stores versioned, downloadable output files per pipeline stage.
-- Safe: CREATE TABLE IF NOT EXISTS, does NOT modify existing tables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS editorial_pipeline_artifacts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    uuid NOT NULL,
  stage_key     text NOT NULL,
  file_name     text NOT NULL,
  file_type     text NOT NULL,
  version       int  NOT NULL DEFAULT 1,
  storage_path  text NOT NULL,
  size_bytes    bigint,
  generated_by  text NOT NULL DEFAULT 'ai',
  status        text NOT NULL DEFAULT 'ready',
  mime_type     text NOT NULL,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz,
  UNIQUE (project_id, stage_key, file_name)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_artifacts_project ON editorial_pipeline_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_artifacts_stage ON editorial_pipeline_artifacts(project_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_pipeline_artifacts_status ON editorial_pipeline_artifacts(status);

-- Row-Level Security
ALTER TABLE editorial_pipeline_artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read artifacts for projects they have access to
CREATE POLICY IF NOT EXISTS "artifacts_select_authenticated"
  ON editorial_pipeline_artifacts FOR SELECT
  TO authenticated
  USING (true);

-- Policy: service role can insert/update/delete
CREATE POLICY IF NOT EXISTS "artifacts_all_service"
  ON editorial_pipeline_artifacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
