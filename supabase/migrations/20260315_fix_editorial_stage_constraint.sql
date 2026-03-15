-- Migration: Fix editorial_projects current_stage CHECK constraint
-- Adds 'export' and 'distribution' to the allowed stage values.
-- The old script add-export-distribution-stages.sql was incorrect because
-- it tried to ALTER an enum type that does not exist (current_stage is TEXT).

-- Drop the existing constraint and add the correct one with all 8 stages.
ALTER TABLE editorial_projects
  DROP CONSTRAINT IF EXISTS editorial_projects_current_stage_check;

ALTER TABLE editorial_projects
  ADD CONSTRAINT editorial_projects_current_stage_check
  CHECK (current_stage IN (
    'ingesta',
    'estructura',
    'estilo',
    'ortotipografia',
    'maquetacion',
    'revision_final',
    'export',
    'distribution'
  ));

-- Update the column comment to reflect all 8 stages.
COMMENT ON COLUMN editorial_projects.current_stage IS
  'Active pipeline stage: ingesta | estructura | estilo | ortotipografia | maquetacion | revision_final | export | distribution';
