-- Migration: Add service_type and page_estimate columns to editorial_projects
-- service_type was accepted by the UI and the API input types but was never
-- persisted because the column did not exist. This migration adds it.

ALTER TABLE editorial_projects
  ADD COLUMN IF NOT EXISTS service_type text
    CHECK (service_type IN ('full_pipeline', 'reedicion', 'rediseno_portada', 'reedicion_y_portada'));

COMMENT ON COLUMN editorial_projects.service_type IS
  'Type of editorial service requested: full_pipeline | reedicion | rediseno_portada | reedicion_y_portada';

-- page_estimate is referenced in process-all route but may not exist yet.
ALTER TABLE editorial_projects
  ADD COLUMN IF NOT EXISTS page_estimate integer NULL;

COMMENT ON COLUMN editorial_projects.page_estimate IS
  'Estimated page count used for KDP spine/cover calculations.';
