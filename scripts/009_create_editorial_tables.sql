-- Reino Editorial AI Engine: database tables
-- Run this in Supabase SQL Editor. Creates 7 tables for the editorial pipeline.
-- Safe to run multiple times (IF NOT EXISTS guards).

-- editorial_projects: top-level project record per book/manuscript
CREATE TABLE IF NOT EXISTS editorial_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NULL,
  title text NOT NULL,
  subtitle text NULL,
  author_name text NULL,
  language text DEFAULT 'es',
  genre text NULL,
  target_audience text NULL,
  word_count integer NULL,
  page_estimate integer NULL,
  current_stage text DEFAULT 'ingesta',
  status text DEFAULT 'created',
  progress_percent integer DEFAULT 0,
  due_date timestamp NULL,
  created_by uuid NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp NULL
);

COMMENT ON TABLE editorial_projects IS 'One record per editorial project (book/manuscript).';
COMMENT ON COLUMN editorial_projects.current_stage IS 'Active pipeline stage: ingesta | estructura | estilo | ortotipografia | maquetacion | revision_final';
COMMENT ON COLUMN editorial_projects.progress_percent IS 'Overall progress 0–100 derived from the current stage.';

CREATE INDEX IF NOT EXISTS idx_editorial_projects_org_id ON editorial_projects (org_id);
CREATE INDEX IF NOT EXISTS idx_editorial_projects_client_id ON editorial_projects (client_id);
CREATE INDEX IF NOT EXISTS idx_editorial_projects_current_stage ON editorial_projects (current_stage);
CREATE INDEX IF NOT EXISTS idx_editorial_projects_status ON editorial_projects (status);
CREATE INDEX IF NOT EXISTS idx_editorial_projects_created_at ON editorial_projects (created_at DESC);

-- editorial_stages: one row per pipeline stage per project (6 rows created on project init)
CREATE TABLE IF NOT EXISTS editorial_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  status text DEFAULT 'pending',
  started_at timestamp NULL,
  completed_at timestamp NULL,
  approved_at timestamp NULL,
  approved_by uuid NULL,
  retry_count integer DEFAULT 0,
  notes text NULL,
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_stages IS 'Per-stage status tracking. 6 rows are inserted automatically when a project is created.';
COMMENT ON COLUMN editorial_stages.stage_key IS 'Pipeline stage identifier: ingesta | estructura | estilo | ortotipografia | maquetacion | revision_final';
COMMENT ON COLUMN editorial_stages.status IS 'Stage status: pending | queued | processing | review_required | approved | failed | completed';

CREATE INDEX IF NOT EXISTS idx_editorial_stages_project_id ON editorial_stages (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_stages_stage_key ON editorial_stages (stage_key);
CREATE INDEX IF NOT EXISTS idx_editorial_stages_status ON editorial_stages (status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_editorial_stages_project_stage ON editorial_stages (project_id, stage_key);

-- editorial_files: manuscript and working files stored in Supabase Storage
CREATE TABLE IF NOT EXISTS editorial_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key text NULL,
  file_type text NOT NULL,
  version integer DEFAULT 1,
  storage_path text NOT NULL,
  mime_type text NULL,
  size_bytes integer NULL,
  uploaded_by uuid NULL,
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_files IS 'Files associated with a project at a given pipeline stage.';
COMMENT ON COLUMN editorial_files.file_type IS 'e.g. manuscript_original, manuscript_edited, cover_draft, export_pdf';
COMMENT ON COLUMN editorial_files.storage_path IS 'Path within the Supabase Storage bucket.';

CREATE INDEX IF NOT EXISTS idx_editorial_files_project_id ON editorial_files (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_files_stage_key ON editorial_files (stage_key);
CREATE INDEX IF NOT EXISTS idx_editorial_files_file_type ON editorial_files (file_type);

-- editorial_jobs: async AI/processing jobs triggered per stage
CREATE TABLE IF NOT EXISTS editorial_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key text NULL,
  job_type text NOT NULL,
  provider text NULL,
  status text DEFAULT 'queued',
  input_ref text NULL,
  output_ref text NULL,
  error_log text NULL,
  started_at timestamp NULL,
  finished_at timestamp NULL,
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_jobs IS 'AI/processing job records for each pipeline stage.';
COMMENT ON COLUMN editorial_jobs.job_type IS 'e.g. structure_analysis, style_pass, spell_check, layout_render';
COMMENT ON COLUMN editorial_jobs.provider IS 'AI or service provider used (e.g. openai, internal).';
COMMENT ON COLUMN editorial_jobs.status IS 'Job lifecycle: queued | processing | completed | failed';
COMMENT ON COLUMN editorial_jobs.input_ref IS 'Reference to input file or storage path.';
COMMENT ON COLUMN editorial_jobs.output_ref IS 'Reference to output file or storage path.';

CREATE INDEX IF NOT EXISTS idx_editorial_jobs_project_id ON editorial_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_stage_key ON editorial_jobs (stage_key);
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_status ON editorial_jobs (status);

-- editorial_comments: internal and client-facing comments per stage
CREATE TABLE IF NOT EXISTS editorial_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key text NULL,
  author_type text NULL,
  author_id uuid NULL,
  comment text NOT NULL,
  visibility text DEFAULT 'internal',
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_comments IS 'Comments and annotations on a project or specific stage.';
COMMENT ON COLUMN editorial_comments.author_type IS 'Who wrote the comment: staff | client | ai';
COMMENT ON COLUMN editorial_comments.visibility IS 'Audience: internal | client';

CREATE INDEX IF NOT EXISTS idx_editorial_comments_project_id ON editorial_comments (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_stage_key ON editorial_comments (stage_key);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_visibility ON editorial_comments (visibility);

-- editorial_exports: final deliverable files (PDF, EPUB, DOCX, etc.)
CREATE TABLE IF NOT EXISTS editorial_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  export_type text NOT NULL,
  version integer DEFAULT 1,
  storage_path text NOT NULL,
  status text DEFAULT 'generating',
  checksum text NULL,
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_exports IS 'Final deliverable exports generated at the end of the pipeline.';
COMMENT ON COLUMN editorial_exports.export_type IS 'e.g. pdf, epub, docx, print_ready_pdf';
COMMENT ON COLUMN editorial_exports.status IS 'Export lifecycle: generating | ready | failed';
COMMENT ON COLUMN editorial_exports.checksum IS 'SHA-256 or MD5 checksum for integrity verification.';

CREATE INDEX IF NOT EXISTS idx_editorial_exports_project_id ON editorial_exports (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_exports_export_type ON editorial_exports (export_type);
CREATE INDEX IF NOT EXISTS idx_editorial_exports_status ON editorial_exports (status);

-- editorial_activity_log: immutable audit trail for all project events
CREATE TABLE IF NOT EXISTS editorial_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  stage_key text NULL,
  event_type text NOT NULL,
  actor_id uuid NULL,
  actor_type text NULL,
  payload jsonb NULL,
  created_at timestamp DEFAULT now()
);

COMMENT ON TABLE editorial_activity_log IS 'Immutable audit trail. Every state change, upload, and approval is recorded here.';
COMMENT ON COLUMN editorial_activity_log.event_type IS 'e.g. project_created, manuscript_uploaded, stage_requested, stage_approved, export_ready';
COMMENT ON COLUMN editorial_activity_log.actor_type IS 'Who triggered the event: staff | client | system | ai';
COMMENT ON COLUMN editorial_activity_log.payload IS 'Arbitrary JSON context for the event.';

CREATE INDEX IF NOT EXISTS idx_editorial_activity_log_project_id ON editorial_activity_log (project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_activity_log_event_type ON editorial_activity_log (event_type);
CREATE INDEX IF NOT EXISTS idx_editorial_activity_log_created_at ON editorial_activity_log (created_at DESC);
