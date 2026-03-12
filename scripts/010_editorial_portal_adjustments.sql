-- Reino Editorial AI Engine: portal adjustments (Phase 2)
-- Adds file visibility support and client-facing indexes.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- Add visibility column to editorial_files so we can show different files
-- to staff vs. clients vs. public.
-- Values: 'internal' (staff only) | 'client' (visible to owner client) | 'public'
ALTER TABLE editorial_files
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'client', 'public'));

COMMENT ON COLUMN editorial_files.visibility IS
  'Who can see this file: internal (staff only) | client (project owner) | public';

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_editorial_files_visibility
  ON editorial_files (visibility);

-- Composite index: project + visibility (most common client query pattern)
CREATE INDEX IF NOT EXISTS idx_editorial_files_project_visibility
  ON editorial_files (project_id, visibility);

-- Index on client_id for fast per-client project listing (already exists from 009,
-- but guard here in case migration order differs)
CREATE INDEX IF NOT EXISTS idx_editorial_projects_client_id
  ON editorial_projects (client_id);

-- Mark existing manuscript_original files as 'client' visible so authors can
-- see their own uploads immediately after migration.
UPDATE editorial_files
  SET visibility = 'client'
  WHERE file_type = 'manuscript_original'
    AND visibility = 'internal';
