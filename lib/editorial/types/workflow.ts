/**
 * Types for the Professional Editorial Workflow system.
 *
 * The workflow is structured as:
 *   Project → Workflow → Phase → Stage → Tasks/Jobs
 */

// ─── Phase keys ─────────────────────────────────────────────────────────

export type WorkflowPhaseKey =
  | "intake"
  | "editorial_analysis"
  | "structural_editing"
  | "line_editing"
  | "copyediting"
  | "text_finalization"
  | "book_specifications"
  | "book_production"
  | "final_proof"
  | "publishing_prep"
  | "distribution";

// ─── Stage keys (all stages across all phases) ─────────────────────────

export type WorkflowStageKey =
  // Phase 1: Intake
  | "manuscript_upload"
  | "technical_validation"
  | "editorial_admission"
  | "project_setup"
  // Phase 2: Editorial Analysis
  | "manuscript_analysis"
  | "structure_analysis"
  | "style_analysis"
  | "problem_detection"
  // Phase 3: Structural Editing
  | "structural_editing"
  | "structural_report"
  | "structural_approval"
  // Phase 4: Line Editing
  | "line_editing_task"
  | "voice_consistency"
  | "style_refinement"
  // Phase 5: Copyediting
  | "grammar_correction"
  | "copyediting_review"
  | "orthotypography"
  | "references_validation"
  // Phase 6: Text Finalization
  | "final_text_lock"
  | "master_manuscript"
  | "editorial_approval"
  // Phase 7: Book Specifications
  | "book_format_selection"
  | "amazon_kdp_configuration"
  | "layout_parameters"
  | "pagination_estimation"
  // Phase 8: Book Production
  | "layout_analysis_task"
  | "book_layout"
  | "cover_design"
  | "cover_approval"
  | "proof_generation"
  // Phase 9: Final Proof
  | "final_proof_task"
  | "proof_corrections"
  | "production_approval"
  // Phase 10: Publishing Preparation
  | "metadata_generation_task"
  | "isbn_registration"
  | "pricing_strategy"
  | "distribution_setup"
  // Phase 11: Distribution
  | "export_validation_task"
  | "distribution_publish"
  | "marketplace_activation";

// ─── Stage status ───────────────────────────────────────────────────────

export type WorkflowStageStatus =
  | "pending"
  | "processing"
  | "needs_review"
  | "completed"
  | "blocked";

// ─── Database row types ─────────────────────────────────────────────────

export interface WorkflowPhase {
  id: string;
  phase_key: WorkflowPhaseKey;
  name: string;
  order: number;
  description: string | null;
  created_at: string;
}

export interface WorkflowStage {
  id: string;
  phase_key: WorkflowPhaseKey;
  stage_key: WorkflowStageKey;
  name: string;
  order: number;
  is_ai_stage: boolean;
  requires_approval: boolean;
  human_required: boolean;
  ai_task_key: string | null;
  legacy_stage_key: string | null;
  description: string | null;
  created_at: string;
}

export interface ProjectWorkflow {
  id: string;
  project_id: string;
  current_phase: WorkflowPhaseKey;
  current_stage: WorkflowStageKey;
  status: "active" | "completed" | "paused" | "cancelled";
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkflowStage {
  id: string;
  project_id: string;
  phase_key: WorkflowPhaseKey;
  stage_key: WorkflowStageKey;
  status: WorkflowStageStatus;
  started_at: string | null;
  completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Book Specifications ────────────────────────────────────────────────

export type PrintType = "black_and_white" | "standard_color" | "premium_color";

export interface BookSpecifications {
  id: string;
  project_id: string;
  trim_size_id: string;
  print_type: PrintType;
  paper_type: string;
  binding: string;
  bleed: string;
  font_size: number;
  line_spacing: number;
  margin_top: number;
  margin_bottom: number;
  margin_inner: number;
  margin_outer: number;
  word_count: number | null;
  estimated_pages: number | null;
  spine_width_in: number | null;
  layout_template: string | null;
  configured_by: string | null;
  configured_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Composite types for API responses ──────────────────────────────────

export interface WorkflowPhaseWithStages extends WorkflowPhase {
  stages: WorkflowStage[];
}

export interface ProjectWorkflowDetail {
  workflow: ProjectWorkflow;
  phases: Array<{
    phase: WorkflowPhase;
    stages: Array<{
      definition: WorkflowStage;
      status: ProjectWorkflowStage | null;
    }>;
    isComplete: boolean;
    isCurrent: boolean;
  }>;
  bookSpecs: BookSpecifications | null;
}
