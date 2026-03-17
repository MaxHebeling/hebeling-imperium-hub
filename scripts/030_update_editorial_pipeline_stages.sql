-- Migration: Update editorial pipeline to 11 stages
-- This script updates the editorial_projects table to use the new pipeline stages

-- Add new columns to editorial_projects
ALTER TABLE editorial_projects 
ADD COLUMN IF NOT EXISTS creative_mode TEXT DEFAULT 'author_directed' CHECK (creative_mode IN ('author_directed', 'editorial_directed')),
ADD COLUMN IF NOT EXISTS cover_prompt TEXT,
ADD COLUMN IF NOT EXISTS cover_notes TEXT,
ADD COLUMN IF NOT EXISTS book_size TEXT,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Update the current_stage constraint to use new stage keys
-- First, we need to migrate existing data to new stages
UPDATE editorial_projects SET current_stage = 
  CASE current_stage
    WHEN 'ingesta' THEN 'recepcion'
    WHEN 'estructura' THEN 'preparacion'
    WHEN 'estilo' THEN 'correccion_linguistica'
    WHEN 'ortotipografia' THEN 'edicion_editorial'
    WHEN 'maquetacion' THEN 'maquetacion_interior'
    WHEN 'revision_final' THEN 'validacion_paginas'
    WHEN 'export' THEN 'marketing_editorial'
    WHEN 'distribution' THEN 'entrega_final'
    ELSE 'recepcion'
  END
WHERE current_stage IN ('ingesta', 'estructura', 'estilo', 'ortotipografia', 'maquetacion', 'revision_final', 'export', 'distribution');

-- Similarly update editorial_stages table
UPDATE editorial_stages SET stage_key = 
  CASE stage_key
    WHEN 'ingesta' THEN 'recepcion'
    WHEN 'estructura' THEN 'preparacion'
    WHEN 'estilo' THEN 'correccion_linguistica'
    WHEN 'ortotipografia' THEN 'edicion_editorial'
    WHEN 'maquetacion' THEN 'maquetacion_interior'
    WHEN 'revision_final' THEN 'validacion_paginas'
    WHEN 'export' THEN 'marketing_editorial'
    WHEN 'distribution' THEN 'entrega_final'
    ELSE stage_key
  END
WHERE stage_key IN ('ingesta', 'estructura', 'estilo', 'ortotipografia', 'maquetacion', 'revision_final', 'export', 'distribution');

-- Update editorial_files table
UPDATE editorial_files SET stage_key = 
  CASE stage_key
    WHEN 'ingesta' THEN 'recepcion'
    WHEN 'estructura' THEN 'preparacion'
    WHEN 'estilo' THEN 'correccion_linguistica'
    WHEN 'ortotipografia' THEN 'edicion_editorial'
    WHEN 'maquetacion' THEN 'maquetacion_interior'
    WHEN 'revision_final' THEN 'validacion_paginas'
    WHEN 'export' THEN 'marketing_editorial'
    WHEN 'distribution' THEN 'entrega_final'
    ELSE stage_key
  END
WHERE stage_key IN ('ingesta', 'estructura', 'estilo', 'ortotipografia', 'maquetacion', 'revision_final', 'export', 'distribution');

-- Update editorial_comments table
UPDATE editorial_comments SET stage_key = 
  CASE stage_key
    WHEN 'ingesta' THEN 'recepcion'
    WHEN 'estructura' THEN 'preparacion'
    WHEN 'estilo' THEN 'correccion_linguistica'
    WHEN 'ortotipografia' THEN 'edicion_editorial'
    WHEN 'maquetacion' THEN 'maquetacion_interior'
    WHEN 'revision_final' THEN 'validacion_paginas'
    WHEN 'export' THEN 'marketing_editorial'
    WHEN 'distribution' THEN 'entrega_final'
    ELSE stage_key
  END
WHERE stage_key IN ('ingesta', 'estructura', 'estilo', 'ortotipografia', 'maquetacion', 'revision_final', 'export', 'distribution');

-- Update editorial_jobs table
UPDATE editorial_jobs SET stage_key = 
  CASE stage_key
    WHEN 'ingesta' THEN 'recepcion'
    WHEN 'estructura' THEN 'preparacion'
    WHEN 'estilo' THEN 'correccion_linguistica'
    WHEN 'ortotipografia' THEN 'edicion_editorial'
    WHEN 'maquetacion' THEN 'maquetacion_interior'
    WHEN 'revision_final' THEN 'validacion_paginas'
    WHEN 'export' THEN 'marketing_editorial'
    WHEN 'distribution' THEN 'entrega_final'
    ELSE stage_key
  END
WHERE stage_key IN ('ingesta', 'estructura', 'estilo', 'ortotipografia', 'maquetacion', 'revision_final', 'export', 'distribution');

-- Create index for creative_mode filtering
CREATE INDEX IF NOT EXISTS idx_editorial_projects_creative_mode ON editorial_projects(creative_mode);
