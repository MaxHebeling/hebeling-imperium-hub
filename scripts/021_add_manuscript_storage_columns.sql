-- Migration: Add manuscript_path and manuscript_url columns to editorial_projects
-- Purpose: Enable n8n Storage node to save file references when uploading manuscripts
-- Safe: uses IF NOT EXISTS pattern, does not modify existing data

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'editorial_projects'
      AND column_name = 'manuscript_path'
  ) THEN
    ALTER TABLE public.editorial_projects ADD COLUMN manuscript_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'editorial_projects'
      AND column_name = 'manuscript_url'
  ) THEN
    ALTER TABLE public.editorial_projects ADD COLUMN manuscript_url text;
  END IF;
END $$;

-- Index for quick lookups on projects with manuscripts
CREATE INDEX IF NOT EXISTS idx_editorial_projects_manuscript_path
  ON public.editorial_projects(manuscript_path)
  WHERE manuscript_path IS NOT NULL;

