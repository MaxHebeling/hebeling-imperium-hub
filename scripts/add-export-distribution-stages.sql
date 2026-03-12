-- Migration: Add export and distribution stages to editorial_stage_key enum
-- This script adds the new pipeline stages to support the Export and Distribution workflow

-- Alter the editorial_stage_key enum type to include new values
ALTER TYPE editorial_stage_key ADD VALUE 'export' BEFORE 'revision_final';
ALTER TYPE editorial_stage_key ADD VALUE 'distribution' AFTER 'export';
