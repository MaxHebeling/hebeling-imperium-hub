-- ============================================================================
-- Hotfix: Backfill editorial_project_workflow_stages for auto-migrated projects
--
-- The original migration (20260315_editorial_workflow_professional.sql) inserted
-- rows into editorial_project_workflow for existing projects but did NOT create
-- the corresponding per-stage records in editorial_project_workflow_stages.
-- This caused migrated projects to appear with empty stage progress.
--
-- This patch creates the missing stage records for every project that already
-- has a workflow row but zero stage rows.  It marks stages in phases that
-- precede the project's current_phase as 'completed' and sets the first stage
-- of the current phase to 'processing'.  Everything else stays 'pending'.
-- ============================================================================

INSERT INTO editorial_project_workflow_stages
  (project_id, phase_key, stage_key, status, started_at, completed_at)
SELECT
  pw.project_id,
  ws.phase_key,
  ws.stage_key,
  CASE
    -- Phases before the current one: mark all stages as completed
    WHEN wp_stage.phase_order < wp_current.phase_order THEN 'completed'
    -- Current phase, current stage: mark as processing
    WHEN ws.phase_key = pw.current_phase
     AND ws.stage_key = pw.current_stage THEN 'processing'
    -- Everything else: pending
    ELSE 'pending'
  END,
  -- started_at: set for completed and processing stages
  CASE
    WHEN wp_stage.phase_order < wp_current.phase_order THEN pw.created_at
    WHEN ws.phase_key = pw.current_phase
     AND ws.stage_key = pw.current_stage THEN pw.updated_at
    ELSE NULL
  END,
  -- completed_at: set only for completed stages
  CASE
    WHEN wp_stage.phase_order < wp_current.phase_order THEN pw.updated_at
    ELSE NULL
  END
FROM editorial_project_workflow pw
-- Cross join all defined stages so every project gets a full set
CROSS JOIN editorial_workflow_stages ws
-- Look up the order of the stage's phase
JOIN editorial_workflow_phases wp_stage
  ON wp_stage.phase_key = ws.phase_key
-- Look up the order of the project's current phase
JOIN editorial_workflow_phases wp_current
  ON wp_current.phase_key = pw.current_phase
-- Only target projects that have NO stage rows yet
WHERE NOT EXISTS (
  SELECT 1
  FROM editorial_project_workflow_stages ps
  WHERE ps.project_id = pw.project_id
)
ON CONFLICT (project_id, phase_key, stage_key) DO NOTHING;
