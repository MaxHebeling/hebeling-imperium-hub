-- Editorial Experience Platform: Timeline, Artifacts, and Timeline Overrides
-- This migration adds the dual-timeline system that separates AI execution
-- from the client-visible editorial journey.

-- ============================================================================
-- 1. Client Editorial Timeline
-- Controlled timeline entries that reveal stages progressively to the author.
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_editorial_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  stage_key TEXT NOT NULL,
  visible_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'upcoming', 'active', 'completed')),
  title TEXT NOT NULL,
  message TEXT,
  preview_asset TEXT,
  scheduled_at TIMESTAMPTZ,
  revealed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_timeline_project
  ON client_editorial_timeline(project_id, visible_day);

CREATE INDEX IF NOT EXISTS idx_client_timeline_status
  ON client_editorial_timeline(project_id, status);

-- ============================================================================
-- 2. Editorial Stage Artifacts
-- Preview assets displayed to the author at each stage of the journey.
-- ============================================================================

CREATE TABLE IF NOT EXISTS editorial_stage_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  stage_key TEXT NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'report_preview', 'annotated_page', 'text_comparison',
    'formatted_page', 'cover_concept', 'pdf_preview',
    'book_mockup', 'chart', 'summary_card', 'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT,
  thumbnail_path TEXT,
  metadata JSONB,
  is_visible_to_client BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stage_artifacts_project
  ON editorial_stage_artifacts(project_id, stage_key);

CREATE INDEX IF NOT EXISTS idx_stage_artifacts_visible
  ON editorial_stage_artifacts(project_id, is_visible_to_client)
  WHERE is_visible_to_client = true;

-- ============================================================================
-- 3. Timeline Overrides
-- Staff can override the automatic timeline schedule.
-- ============================================================================

CREATE TABLE IF NOT EXISTS editorial_timeline_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN (
    'reveal_early', 'pause', 'resume', 'skip', 'set_day', 'complete_stage', 'send_message'
  )),
  stage_key TEXT,
  payload JSONB,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_overrides_project
  ON editorial_timeline_overrides(project_id, created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE client_editorial_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_stage_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_timeline_overrides ENABLE ROW LEVEL SECURITY;

-- Client timeline: clients can read rows for their own projects
CREATE POLICY "Clients read own timeline"
  ON client_editorial_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM editorial_projects ep
      WHERE ep.id = client_editorial_timeline.project_id
        AND ep.client_id = auth.uid()
    )
  );

-- Artifacts: clients can read visible artifacts for their own projects
CREATE POLICY "Clients read visible artifacts"
  ON editorial_stage_artifacts FOR SELECT
  USING (
    is_visible_to_client = true
    AND EXISTS (
      SELECT 1 FROM editorial_projects ep
      WHERE ep.id = editorial_stage_artifacts.project_id
        AND ep.client_id = auth.uid()
    )
  );

-- Timeline overrides: no client access (staff-only via service role)
-- Service role bypasses RLS, so no explicit staff policy needed.
