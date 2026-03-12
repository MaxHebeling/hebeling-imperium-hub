-- Reino Editorial AI Engine: AI Suggestions – DOCX Editorial Pipeline
-- Stores paragraph-level text suggestions to be applied to a manuscript DOCX.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_ai_suggestions
-- Paragraph-level suggestions linked to a source manuscript file.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_ai_suggestions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  file_id          uuid NULL REFERENCES editorial_files (id) ON DELETE SET NULL,

  paragraph_index  integer NOT NULL,    -- 0-based index of the target paragraph
  original_text    text NOT NULL,       -- text to be replaced
  suggested_text   text NOT NULL,       -- replacement text
  applied          boolean NOT NULL DEFAULT false,

  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eas_project_id ON editorial_ai_suggestions (project_id);
CREATE INDEX IF NOT EXISTS idx_eas_file_id    ON editorial_ai_suggestions (file_id);
CREATE INDEX IF NOT EXISTS idx_eas_applied    ON editorial_ai_suggestions (project_id, applied);

ALTER TABLE editorial_ai_suggestions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'editorial_ai_suggestions' AND policyname = 'eas_service_all'
  ) THEN
    CREATE POLICY "eas_service_all" ON editorial_ai_suggestions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
