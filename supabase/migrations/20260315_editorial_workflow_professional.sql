-- ============================================================================
-- Editorial Workflow Professional — Migration
-- Creates workflow phases, stages, project workflow tracking, and book specs.
-- Safe: does NOT alter any existing tables.
-- ============================================================================

-- 1. Workflow Phases ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_workflow_phases (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_key     text NOT NULL UNIQUE,
  name          text NOT NULL,
  "order"       int  NOT NULL,
  description   text,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- 2. Workflow Stages ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_workflow_stages (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_key         text NOT NULL REFERENCES editorial_workflow_phases(phase_key) ON DELETE CASCADE,
  stage_key         text NOT NULL,
  name              text NOT NULL,
  "order"           int  NOT NULL,
  is_ai_stage       boolean DEFAULT false NOT NULL,
  requires_approval boolean DEFAULT false NOT NULL,
  human_required    boolean DEFAULT false NOT NULL,
  -- Maps to an existing editorial_jobs task key (nullable if purely human)
  ai_task_key       text,
  -- Maps to an existing editorial_stages stage_key (nullable if new)
  legacy_stage_key  text,
  description       text,
  created_at        timestamptz DEFAULT now() NOT NULL,
  UNIQUE (phase_key, stage_key)
);

-- 3. Project Workflow Tracking ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_project_workflow (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       uuid NOT NULL,
  current_phase    text NOT NULL REFERENCES editorial_workflow_phases(phase_key),
  current_stage    text NOT NULL,
  status           text DEFAULT 'active' NOT NULL,
  progress_percent int  DEFAULT 0 NOT NULL,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (project_id)
);

-- 4. Per-stage status within a project ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_project_workflow_stages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   uuid NOT NULL,
  phase_key    text NOT NULL,
  stage_key    text NOT NULL,
  status       text DEFAULT 'pending' NOT NULL,
  started_at   timestamptz,
  completed_at timestamptz,
  approved_by  uuid,
  approved_at  timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (project_id, phase_key, stage_key)
);

-- 5. Book Specifications (KDP) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_book_specifications (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        uuid NOT NULL UNIQUE,
  trim_size_id      text DEFAULT '6x9' NOT NULL,
  print_type        text DEFAULT 'black_and_white' NOT NULL,
  paper_type        text DEFAULT 'cream' NOT NULL,
  binding           text DEFAULT 'paperback' NOT NULL,
  bleed             text DEFAULT 'no_bleed' NOT NULL,
  font_size         numeric(4,1) DEFAULT 11.0,
  line_spacing      numeric(4,2) DEFAULT 1.15,
  margin_top        numeric(5,3) DEFAULT 0.750,
  margin_bottom     numeric(5,3) DEFAULT 0.750,
  margin_inner      numeric(5,3) DEFAULT 0.875,
  margin_outer      numeric(5,3) DEFAULT 0.500,
  word_count        int,
  estimated_pages   int,
  spine_width_in    numeric(6,4),
  layout_template   text,
  configured_by     uuid,
  configured_at     timestamptz,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

-- 6. Seed workflow phases ────────────────────────────────────────────────────

INSERT INTO editorial_workflow_phases (phase_key, name, "order", description) VALUES
  ('intake',               'Intake & Admission',       1,  'Recepcion y admision del manuscrito'),
  ('editorial_analysis',   'Editorial Analysis',       2,  'Analisis editorial con AI'),
  ('structural_editing',   'Structural Editing',       3,  'Edicion estructural del manuscrito'),
  ('line_editing',         'Line Editing',             4,  'Edicion de linea y voz'),
  ('copyediting',          'Copyediting',              5,  'Correccion de estilo y ortotipografia'),
  ('text_finalization',    'Text Finalization',        6,  'Finalizacion y bloqueo del texto'),
  ('book_specifications',  'Book Specifications',      7,  'Especificaciones del libro para Amazon KDP'),
  ('book_production',      'Book Production',          8,  'Produccion del libro (maquetacion y portada)'),
  ('final_proof',          'Final Proof',              9,  'Prueba final y correcciones'),
  ('publishing_prep',      'Publishing Preparation',  10,  'Preparacion para publicacion'),
  ('distribution',         'Distribution',            11,  'Distribucion y activacion en marketplaces')
ON CONFLICT (phase_key) DO NOTHING;

-- 7. Seed workflow stages ────────────────────────────────────────────────────

-- Phase 1: Intake & Admission
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('intake', 'manuscript_upload',      'Manuscript Upload',      1, false, false, true,  NULL, 'ingesta', 'Subida del manuscrito original'),
  ('intake', 'technical_validation',   'Technical Validation',   2, true,  false, false, NULL, 'ingesta', 'Validacion de formato, idioma, conteo de palabras'),
  ('intake', 'editorial_admission',    'Editorial Admission',    3, false, true,  true,  NULL, NULL,      'Evaluacion y decision de admision'),
  ('intake', 'project_setup',          'Project Setup',          4, false, false, true,  NULL, NULL,      'Configuracion inicial del proyecto')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 2: Editorial Analysis
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('editorial_analysis', 'manuscript_analysis',  'Manuscript Analysis',  1, true,  false, false, 'manuscript_analysis',  'ingesta',        'Analisis general del manuscrito'),
  ('editorial_analysis', 'structure_analysis',   'Structure Analysis',   2, true,  false, false, 'structure_analysis',   'estructura',     'Analisis de estructura narrativa'),
  ('editorial_analysis', 'style_analysis',       'Style Analysis',       3, true,  false, false, 'style_suggestions',    'estilo',         'Analisis de estilo y sugerencias'),
  ('editorial_analysis', 'problem_detection',    'Problem Detection',    4, true,  false, false, 'orthotypography_review','ortotipografia', 'Deteccion de problemas ortotipograficos')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 3: Structural Editing
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('structural_editing', 'structural_editing',   'Structural Editing',   1, true,  false, true,  'structure_analysis', 'estructura', 'Edicion estructural con sugerencias AI'),
  ('structural_editing', 'structural_report',    'Structural Report',    2, true,  false, false, 'issue_detection',    NULL,         'Reporte de cambios estructurales'),
  ('structural_editing', 'structural_approval',  'Structural Approval',  3, false, true,  true,  NULL,                 NULL,         'Aprobacion de cambios estructurales')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 4: Line Editing
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('line_editing', 'line_editing_task',    'Line Editing',         1, true,  false, true,  'line_editing',      'estilo', 'Edicion de linea con AI'),
  ('line_editing', 'voice_consistency',    'Voice Consistency',    2, true,  false, false, 'style_suggestions', NULL,     'Verificacion de consistencia de voz'),
  ('line_editing', 'style_refinement',     'Style Refinement',     3, false, true,  true,  NULL,                NULL,     'Refinamiento final de estilo')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 5: Copyediting
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('copyediting', 'grammar_correction',      'Grammar Correction',      1, true,  false, false, 'copyediting',            'ortotipografia', 'Correccion gramatical con AI'),
  ('copyediting', 'copyediting_review',      'Copyediting Review',      2, true,  false, true,  'copyediting',            NULL,              'Revision de correccion de estilo'),
  ('copyediting', 'orthotypography',         'Orthotypography',         3, true,  false, false, 'orthotypography_review',  'ortotipografia', 'Revision ortotipografica'),
  ('copyediting', 'references_validation',   'References Validation',   4, false, false, true,  NULL,                      NULL,              'Validacion de referencias y citas')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 6: Text Finalization
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('text_finalization', 'final_text_lock',      'Final Text Lock',        1, false, false, true,  NULL,              NULL, 'Bloqueo final del texto'),
  ('text_finalization', 'master_manuscript',     'Master Manuscript',      2, false, false, true,  NULL,              NULL, 'Creacion del manuscrito maestro'),
  ('text_finalization', 'editorial_approval',    'Editorial Approval',     3, false, true,  true,  NULL,              NULL, 'Aprobacion editorial final')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 7: Book Specifications
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('book_specifications', 'book_format_selection',      'Book Format Selection',       1, false, false, true,  NULL, NULL,          'Seleccion de formato del libro'),
  ('book_specifications', 'amazon_kdp_configuration',   'Amazon KDP Configuration',    2, false, false, true,  NULL, NULL,          'Configuracion especifica para Amazon KDP'),
  ('book_specifications', 'layout_parameters',          'Layout Parameters',           3, false, false, true,  NULL, 'maquetacion', 'Parametros de maquetacion'),
  ('book_specifications', 'pagination_estimation',      'Pagination Estimation',       4, true,  false, false, NULL, NULL,          'Estimacion automatica de paginacion')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 8: Book Production
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('book_production', 'layout_analysis_task',  'Layout Analysis',      1, true,  false, false, 'layout_analysis',    'maquetacion',    'Analisis de maquetacion con AI'),
  ('book_production', 'book_layout',           'Book Layout',          2, false, false, true,  NULL,                  'maquetacion',    'Maquetacion del libro'),
  ('book_production', 'cover_design',          'Cover Design',         3, false, false, true,  NULL,                  NULL,              'Diseno de portada'),
  ('book_production', 'cover_approval',        'Cover Approval',       4, false, true,  true,  NULL,                  NULL,              'Aprobacion de portada'),
  ('book_production', 'proof_generation',      'Proof Generation',     5, false, false, false, NULL,                  NULL,              'Generacion de prueba de impresion')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 9: Final Proof
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('final_proof', 'final_proof_task',     'Final Proof',           1, false, false, true,  NULL, 'revision_final', 'Prueba final del libro'),
  ('final_proof', 'proof_corrections',    'Proof Corrections',     2, false, false, true,  NULL, NULL,             'Correcciones de prueba'),
  ('final_proof', 'production_approval',  'Production Approval',   3, false, true,  true,  NULL, NULL,             'Aprobacion para produccion')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 10: Publishing Preparation
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('publishing_prep', 'metadata_generation_task',  'Metadata Generation',    1, true,  false, false, 'metadata_generation', 'export',       'Generacion de metadatos con AI'),
  ('publishing_prep', 'isbn_registration',         'ISBN Registration',      2, false, false, true,  NULL,                  NULL,            'Registro de ISBN'),
  ('publishing_prep', 'pricing_strategy',          'Pricing Strategy',       3, false, false, true,  NULL,                  NULL,            'Estrategia de precios'),
  ('publishing_prep', 'distribution_setup',        'Distribution Setup',     4, false, false, true,  NULL,                  'distribution',  'Configuracion de distribucion')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- Phase 11: Distribution
INSERT INTO editorial_workflow_stages (phase_key, stage_key, name, "order", is_ai_stage, requires_approval, human_required, ai_task_key, legacy_stage_key, description) VALUES
  ('distribution', 'export_validation_task',    'Export Validation',        1, true,  false, false, 'export_validation',  'export',       'Validacion de exportacion con AI'),
  ('distribution', 'distribution_publish',      'Distribution Publish',     2, false, true,  true,  NULL,                  'distribution', 'Publicacion en plataformas'),
  ('distribution', 'marketplace_activation',    'Marketplace Activation',   3, false, false, true,  NULL,                  'distribution', 'Activacion en marketplaces')
ON CONFLICT (phase_key, stage_key) DO NOTHING;

-- 8. Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_workflow_stages_phase ON editorial_workflow_stages(phase_key);
CREATE INDEX IF NOT EXISTS idx_project_workflow_project ON editorial_project_workflow(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_stages_project ON editorial_project_workflow_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_stages_phase ON editorial_project_workflow_stages(phase_key);
CREATE INDEX IF NOT EXISTS idx_book_specs_project ON editorial_book_specifications(project_id);

-- 9. Auto-assign workflow to existing projects ───────────────────────────────
-- Maps existing editorial_projects to the new workflow system based on their
-- current_stage value. Does NOT modify the original editorial_projects table.

INSERT INTO editorial_project_workflow (project_id, current_phase, current_stage, status, progress_percent)
SELECT
  ep.id,
  CASE ep.current_stage
    WHEN 'ingesta'        THEN 'intake'
    WHEN 'estructura'     THEN 'editorial_analysis'
    WHEN 'estilo'         THEN 'line_editing'
    WHEN 'ortotipografia' THEN 'copyediting'
    WHEN 'maquetacion'    THEN 'book_production'
    WHEN 'revision_final' THEN 'final_proof'
    WHEN 'export'         THEN 'publishing_prep'
    WHEN 'distribution'   THEN 'distribution'
    ELSE 'intake'
  END,
  CASE ep.current_stage
    WHEN 'ingesta'        THEN 'manuscript_upload'
    WHEN 'estructura'     THEN 'structure_analysis'
    WHEN 'estilo'         THEN 'line_editing_task'
    WHEN 'ortotipografia' THEN 'grammar_correction'
    WHEN 'maquetacion'    THEN 'layout_analysis_task'
    WHEN 'revision_final' THEN 'final_proof_task'
    WHEN 'export'         THEN 'metadata_generation_task'
    WHEN 'distribution'   THEN 'distribution_publish'
    ELSE 'manuscript_upload'
  END,
  CASE WHEN ep.status = 'completed' THEN 'completed' ELSE 'active' END,
  ep.progress_percent
FROM editorial_projects ep
WHERE NOT EXISTS (
  SELECT 1 FROM editorial_project_workflow pw WHERE pw.project_id = ep.id
);
