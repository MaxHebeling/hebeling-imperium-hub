/**
 * Professional Editorial Workflow — Constants, helpers, and query functions.
 *
 * This module provides the full workflow definition (11 phases, ~40 stages)
 * and integrates with the existing editorial pipeline without breaking it.
 */

import { getAdminClient } from "@/lib/leads/helpers";
import type {
  WorkflowPhaseKey,
  WorkflowStageKey,
  WorkflowPhase,
  WorkflowStage,
  WorkflowPhaseWithStages,
  ProjectWorkflow,
  ProjectWorkflowStage,
  ProjectWorkflowDetail,
  BookSpecifications,
  WorkflowStageStatus,
} from "@/lib/editorial/types/workflow";

// ─── Static phase definitions (for fast lookups without DB) ─────────────

export interface PhaseDefinition {
  key: WorkflowPhaseKey;
  name: string;
  order: number;
  description: string;
  stages: StageDefinition[];
}

export interface StageDefinition {
  key: WorkflowStageKey;
  name: string;
  order: number;
  isAiStage: boolean;
  requiresApproval: boolean;
  humanRequired: boolean;
  aiTaskKey: string | null;
  legacyStageKey: string | null;
  description: string;
}

export const WORKFLOW_PHASES: PhaseDefinition[] = [
  {
    key: "intake",
    name: "Intake & Admission",
    order: 1,
    description: "Recepcion y admision del manuscrito",
    stages: [
      { key: "manuscript_upload", name: "Manuscript Upload", order: 1, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "ingesta", description: "Subida del manuscrito original" },
      { key: "technical_validation", name: "Technical Validation", order: 2, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: null, legacyStageKey: "ingesta", description: "Validacion de formato, idioma, conteo de palabras" },
      { key: "editorial_admission", name: "Editorial Admission", order: 3, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Evaluacion y decision de admision" },
      { key: "project_setup", name: "Project Setup", order: 4, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Configuracion inicial del proyecto" },
    ],
  },
  {
    key: "editorial_analysis",
    name: "Editorial Analysis",
    order: 2,
    description: "Analisis editorial con AI",
    stages: [
      { key: "manuscript_analysis", name: "Manuscript Analysis", order: 1, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "manuscript_analysis", legacyStageKey: "ingesta", description: "Analisis general del manuscrito" },
      { key: "structure_analysis", name: "Structure Analysis", order: 2, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "structure_analysis", legacyStageKey: "estructura", description: "Analisis de estructura narrativa" },
      { key: "style_analysis", name: "Style Analysis", order: 3, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "style_suggestions", legacyStageKey: "estilo", description: "Analisis de estilo y sugerencias" },
      { key: "problem_detection", name: "Problem Detection", order: 4, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "orthotypography_review", legacyStageKey: "ortotipografia", description: "Deteccion de problemas ortotipograficos" },
    ],
  },
  {
    key: "structural_editing",
    name: "Structural Editing",
    order: 3,
    description: "Edicion estructural del manuscrito",
    stages: [
      { key: "structural_editing", name: "Structural Editing", order: 1, isAiStage: true, requiresApproval: false, humanRequired: true, aiTaskKey: "structure_analysis", legacyStageKey: "estructura", description: "Edicion estructural con sugerencias AI" },
      { key: "structural_report", name: "Structural Report", order: 2, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "issue_detection", legacyStageKey: null, description: "Reporte de cambios estructurales" },
      { key: "structural_approval", name: "Structural Approval", order: 3, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Aprobacion de cambios estructurales" },
    ],
  },
  {
    key: "line_editing",
    name: "Line Editing",
    order: 4,
    description: "Edicion de linea y voz",
    stages: [
      { key: "line_editing_task", name: "Line Editing", order: 1, isAiStage: true, requiresApproval: false, humanRequired: true, aiTaskKey: "line_editing", legacyStageKey: "estilo", description: "Edicion de linea con AI" },
      { key: "voice_consistency", name: "Voice Consistency", order: 2, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "style_suggestions", legacyStageKey: null, description: "Verificacion de consistencia de voz" },
      { key: "style_refinement", name: "Style Refinement", order: 3, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Refinamiento final de estilo" },
    ],
  },
  {
    key: "copyediting",
    name: "Copyediting",
    order: 5,
    description: "Correccion de estilo y ortotipografia",
    stages: [
      { key: "grammar_correction", name: "Grammar Correction", order: 1, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "copyediting", legacyStageKey: "ortotipografia", description: "Correccion gramatical con AI" },
      { key: "copyediting_review", name: "Copyediting Review", order: 2, isAiStage: true, requiresApproval: false, humanRequired: true, aiTaskKey: "copyediting", legacyStageKey: null, description: "Revision de correccion de estilo" },
      { key: "orthotypography", name: "Orthotypography", order: 3, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "orthotypography_review", legacyStageKey: "ortotipografia", description: "Revision ortotipografica" },
      { key: "references_validation", name: "References Validation", order: 4, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Validacion de referencias y citas" },
    ],
  },
  {
    key: "text_finalization",
    name: "Text Finalization",
    order: 6,
    description: "Finalizacion y bloqueo del texto",
    stages: [
      { key: "final_text_lock", name: "Final Text Lock", order: 1, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Bloqueo final del texto" },
      { key: "master_manuscript", name: "Master Manuscript", order: 2, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Creacion del manuscrito maestro" },
      { key: "editorial_approval", name: "Editorial Approval", order: 3, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Aprobacion editorial final" },
    ],
  },
  {
    key: "book_specifications",
    name: "Book Specifications",
    order: 7,
    description: "Especificaciones del libro para Amazon KDP",
    stages: [
      { key: "book_format_selection", name: "Book Format Selection", order: 1, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Seleccion de formato del libro" },
      { key: "amazon_kdp_configuration", name: "Amazon KDP Configuration", order: 2, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Configuracion especifica para Amazon KDP" },
      { key: "layout_parameters", name: "Layout Parameters", order: 3, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "maquetacion", description: "Parametros de maquetacion" },
      { key: "pagination_estimation", name: "Pagination Estimation", order: 4, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: null, legacyStageKey: null, description: "Estimacion automatica de paginacion" },
    ],
  },
  {
    key: "book_production",
    name: "Book Production",
    order: 8,
    description: "Produccion del libro (maquetacion y portada)",
    stages: [
      { key: "layout_analysis_task", name: "Layout Analysis", order: 1, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "layout_analysis", legacyStageKey: "maquetacion", description: "Analisis de maquetacion con AI" },
      { key: "book_layout", name: "Book Layout", order: 2, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "maquetacion", description: "Maquetacion del libro" },
      { key: "cover_design", name: "Cover Design", order: 3, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Diseno de portada" },
      { key: "cover_approval", name: "Cover Approval", order: 4, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Aprobacion de portada" },
      { key: "proof_generation", name: "Proof Generation", order: 5, isAiStage: false, requiresApproval: false, humanRequired: false, aiTaskKey: null, legacyStageKey: null, description: "Generacion de prueba de impresion" },
    ],
  },
  {
    key: "final_proof",
    name: "Final Proof",
    order: 9,
    description: "Prueba final y correcciones",
    stages: [
      { key: "final_proof_task", name: "Final Proof", order: 1, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "revision_final", description: "Prueba final del libro" },
      { key: "proof_corrections", name: "Proof Corrections", order: 2, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Correcciones de prueba" },
      { key: "production_approval", name: "Production Approval", order: 3, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Aprobacion para produccion" },
    ],
  },
  {
    key: "publishing_prep",
    name: "Publishing Preparation",
    order: 10,
    description: "Preparacion para publicacion",
    stages: [
      { key: "metadata_generation_task", name: "Metadata Generation", order: 1, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "metadata_generation", legacyStageKey: "export", description: "Generacion de metadatos con AI" },
      { key: "isbn_registration", name: "ISBN Registration", order: 2, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Registro de ISBN" },
      { key: "pricing_strategy", name: "Pricing Strategy", order: 3, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: null, description: "Estrategia de precios" },
      { key: "distribution_setup", name: "Distribution Setup", order: 4, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "distribution", description: "Configuracion de distribucion" },
    ],
  },
  {
    key: "distribution",
    name: "Distribution",
    order: 11,
    description: "Distribucion y activacion en marketplaces",
    stages: [
      { key: "export_validation_task", name: "Export Validation", order: 1, isAiStage: true, requiresApproval: false, humanRequired: false, aiTaskKey: "export_validation", legacyStageKey: "export", description: "Validacion de exportacion con AI" },
      { key: "distribution_publish", name: "Distribution Publish", order: 2, isAiStage: false, requiresApproval: true, humanRequired: true, aiTaskKey: null, legacyStageKey: "distribution", description: "Publicacion en plataformas" },
      { key: "marketplace_activation", name: "Marketplace Activation", order: 3, isAiStage: false, requiresApproval: false, humanRequired: true, aiTaskKey: null, legacyStageKey: "distribution", description: "Activacion en marketplaces" },
    ],
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────

export function getPhaseByKey(key: WorkflowPhaseKey): PhaseDefinition | undefined {
  return WORKFLOW_PHASES.find((p) => p.key === key);
}

export function getStageByKey(stageKey: WorkflowStageKey): StageDefinition | undefined {
  for (const phase of WORKFLOW_PHASES) {
    const stage = phase.stages.find((s) => s.key === stageKey);
    if (stage) return stage;
  }
  return undefined;
}

export function getPhaseForStage(stageKey: WorkflowStageKey): PhaseDefinition | undefined {
  return WORKFLOW_PHASES.find((p) => p.stages.some((s) => s.key === stageKey));
}

/** Get the total number of stages across all phases. */
export function getTotalStages(): number {
  return WORKFLOW_PHASES.reduce((sum, p) => sum + p.stages.length, 0);
}

/** Calculate overall progress percent based on completed stages. */
export function calculateWorkflowProgress(
  currentPhase: WorkflowPhaseKey,
  currentStage: WorkflowStageKey
): number {
  const total = getTotalStages();
  let completed = 0;

  for (const phase of WORKFLOW_PHASES) {
    if (phase.order < (getPhaseByKey(currentPhase)?.order ?? 0)) {
      completed += phase.stages.length;
    } else if (phase.key === currentPhase) {
      for (const stage of phase.stages) {
        if (stage.order < (phase.stages.find((s) => s.key === currentStage)?.order ?? 0)) {
          completed++;
        }
      }
      break;
    }
  }

  return Math.round((completed / total) * 100);
}

/** Get the next stage in the workflow (across phases). */
export function getNextWorkflowStage(
  currentPhase: WorkflowPhaseKey,
  currentStage: WorkflowStageKey
): { phaseKey: WorkflowPhaseKey; stageKey: WorkflowStageKey } | null {
  const phase = getPhaseByKey(currentPhase);
  if (!phase) return null;

  const stageIdx = phase.stages.findIndex((s) => s.key === currentStage);

  // Next stage in same phase
  if (stageIdx >= 0 && stageIdx < phase.stages.length - 1) {
    return {
      phaseKey: currentPhase,
      stageKey: phase.stages[stageIdx + 1].key,
    };
  }

  // First stage of next phase
  const phaseIdx = WORKFLOW_PHASES.findIndex((p) => p.key === currentPhase);
  if (phaseIdx >= 0 && phaseIdx < WORKFLOW_PHASES.length - 1) {
    const nextPhase = WORKFLOW_PHASES[phaseIdx + 1];
    return {
      phaseKey: nextPhase.key,
      stageKey: nextPhase.stages[0].key,
    };
  }

  return null; // End of workflow
}

// ─── Database queries ───────────────────────────────────────────────────

/** Fetch all workflow phases from DB (with stages). */
export async function fetchWorkflowDefinition(): Promise<WorkflowPhaseWithStages[]> {
  const supabase = getAdminClient();

  const { data: phases } = await supabase
    .from("editorial_workflow_phases")
    .select("*")
    .order("order", { ascending: true });

  const { data: stages } = await supabase
    .from("editorial_workflow_stages")
    .select("*")
    .order("order", { ascending: true });

  return (phases ?? []).map((phase) => ({
    ...(phase as WorkflowPhase),
    stages: (stages ?? [])
      .filter((s) => s.phase_key === phase.phase_key)
      .map((s) => s as WorkflowStage),
  }));
}

/** Get (or create) project workflow tracking record. */
export async function getProjectWorkflow(projectId: string): Promise<ProjectWorkflow | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_project_workflow")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    console.error("[Workflow] Error fetching project workflow:", error);
    return null;
  }

  return data as ProjectWorkflow | null;
}

/** Initialize workflow for a project (creates tracking record + all stage statuses). */
export async function initializeProjectWorkflow(
  projectId: string,
  startPhase: WorkflowPhaseKey = "intake",
  startStage: WorkflowStageKey = "manuscript_upload"
): Promise<ProjectWorkflow> {
  const supabase = getAdminClient();

  // Create main workflow record
  const { data: workflow, error: wfError } = await supabase
    .from("editorial_project_workflow")
    .upsert(
      {
        project_id: projectId,
        current_phase: startPhase,
        current_stage: startStage,
        status: "active",
        progress_percent: 0,
      },
      { onConflict: "project_id" }
    )
    .select()
    .single();

  if (wfError || !workflow) {
    throw new Error(`Failed to initialize workflow: ${wfError?.message}`);
  }

  // Create stage status records for all stages
  const stageRecords = WORKFLOW_PHASES.flatMap((phase) =>
    phase.stages.map((stage) => ({
      project_id: projectId,
      phase_key: phase.key,
      stage_key: stage.key,
      status: "pending" as WorkflowStageStatus,
    }))
  );

  await supabase
    .from("editorial_project_workflow_stages")
    .upsert(stageRecords, { onConflict: "project_id,phase_key,stage_key" });

  return workflow as ProjectWorkflow;
}

/** Get all stage statuses for a project. */
export async function getProjectWorkflowStages(
  projectId: string
): Promise<ProjectWorkflowStage[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_project_workflow_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Workflow] Error fetching workflow stages:", error);
    return [];
  }

  return (data ?? []) as ProjectWorkflowStage[];
}

/** Get full workflow detail for a project (for API/UI). */
export async function getProjectWorkflowDetail(
  projectId: string
): Promise<ProjectWorkflowDetail | null> {
  const workflow = await getProjectWorkflow(projectId);
  if (!workflow) return null;

  const stageStatuses = await getProjectWorkflowStages(projectId);
  const bookSpecs = await getBookSpecifications(projectId);

  const phases = WORKFLOW_PHASES.map((phaseDef) => {
    const stagesWithStatus = phaseDef.stages.map((stageDef) => {
      const status = stageStatuses.find(
        (s) => s.phase_key === phaseDef.key && s.stage_key === stageDef.key
      );
      return {
        definition: {
          id: "",
          phase_key: phaseDef.key,
          stage_key: stageDef.key,
          name: stageDef.name,
          order: stageDef.order,
          is_ai_stage: stageDef.isAiStage,
          requires_approval: stageDef.requiresApproval,
          human_required: stageDef.humanRequired,
          ai_task_key: stageDef.aiTaskKey,
          legacy_stage_key: stageDef.legacyStageKey,
          description: stageDef.description,
          created_at: "",
        } as WorkflowStage,
        status: status ?? null,
      };
    });

    const isComplete = stagesWithStatus.every(
      (s) => s.status?.status === "completed"
    );
    const isCurrent = workflow.current_phase === phaseDef.key;

    return {
      phase: {
        id: "",
        phase_key: phaseDef.key,
        name: phaseDef.name,
        order: phaseDef.order,
        description: phaseDef.description,
        created_at: "",
      } as WorkflowPhase,
      stages: stagesWithStatus,
      isComplete,
      isCurrent,
    };
  });

  return { workflow, phases, bookSpecs };
}

// ─── Stage transitions ──────────────────────────────────────────────────

/** Advance a workflow stage to a new status. */
export async function updateWorkflowStageStatus(
  projectId: string,
  phaseKey: WorkflowPhaseKey,
  stageKey: WorkflowStageKey,
  status: WorkflowStageStatus,
  approvedBy?: string
): Promise<void> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = { status };

  if (status === "processing" && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }
  if (approvedBy) {
    updates.approved_by = approvedBy;
    updates.approved_at = new Date().toISOString();
  }

  await supabase
    .from("editorial_project_workflow_stages")
    .update(updates)
    .eq("project_id", projectId)
    .eq("phase_key", phaseKey)
    .eq("stage_key", stageKey);
}

/** Advance the project workflow to the next stage/phase. */
export async function advanceWorkflow(
  projectId: string
): Promise<{ phaseKey: WorkflowPhaseKey; stageKey: WorkflowStageKey } | null> {
  const workflow = await getProjectWorkflow(projectId);
  if (!workflow) return null;

  // Check if current stage requires approval
  const currentStageDef = getStageByKey(workflow.current_stage);
  if (currentStageDef?.requiresApproval) {
    const supabase = getAdminClient();
    const { data: stageStatus } = await supabase
      .from("editorial_project_workflow_stages")
      .select("status, approved_by")
      .eq("project_id", projectId)
      .eq("stage_key", workflow.current_stage)
      .maybeSingle();

    if (!stageStatus?.approved_by) {
      console.warn(
        `[Workflow] Stage ${workflow.current_stage} requires approval before advancing.`
      );
      return null;
    }
  }

  // Mark current stage as completed
  await updateWorkflowStageStatus(
    projectId,
    workflow.current_phase,
    workflow.current_stage,
    "completed"
  );

  // Get next stage
  const next = getNextWorkflowStage(workflow.current_phase, workflow.current_stage);
  if (!next) {
    // Workflow complete
    const supabase = getAdminClient();
    await supabase
      .from("editorial_project_workflow")
      .update({
        status: "completed",
        progress_percent: 100,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId);
    return null;
  }

  // Update workflow pointer
  const progress = calculateWorkflowProgress(next.phaseKey, next.stageKey);
  const supabase = getAdminClient();
  await supabase
    .from("editorial_project_workflow")
    .update({
      current_phase: next.phaseKey,
      current_stage: next.stageKey,
      progress_percent: progress,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId);

  // Mark next stage as processing
  await updateWorkflowStageStatus(
    projectId,
    next.phaseKey,
    next.stageKey,
    "processing"
  );

  return next;
}

// ─── Book Specifications ────────────────────────────────────────────────

/** Get book specifications for a project. */
export async function getBookSpecifications(
  projectId: string
): Promise<BookSpecifications | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_book_specifications")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BookSpecifications;
}

/** Create or update book specifications. */
export async function upsertBookSpecifications(
  projectId: string,
  specs: Partial<Omit<BookSpecifications, "id" | "project_id" | "created_at" | "updated_at">>,
  configuredBy?: string
): Promise<BookSpecifications> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_book_specifications")
    .upsert(
      {
        project_id: projectId,
        ...specs,
        configured_by: configuredBy ?? null,
        configured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert book specifications: ${error?.message}`);
  }

  return data as BookSpecifications;
}

/** Estimate page count from word count and typography params. */
export function estimatePageCount(
  wordCount: number,
  fontSize: number = 11,
  lineSpacing: number = 1.15,
  trimSizeId: string = "6x9"
): number {
  // Average words per page based on trim size and font settings
  // For 6x9 with 11pt/1.15 spacing: ~250 words/page
  const baseDensity = trimSizeId === "5x8" ? 220
    : trimSizeId === "5.25x8" ? 230
    : trimSizeId === "5.5x8.5" ? 240
    : trimSizeId === "6x9" ? 250
    : trimSizeId === "7x10" ? 320
    : trimSizeId === "8x10" ? 380
    : 250;

  // Adjust for font size (smaller = more words per page)
  const fontFactor = 11 / fontSize;
  // Adjust for line spacing (tighter = more words per page)
  const spacingFactor = 1.15 / lineSpacing;

  const wordsPerPage = baseDensity * fontFactor * spacingFactor;
  // Round up to nearest even number (required by KDP)
  const rawPages = Math.ceil(wordCount / wordsPerPage);
  return rawPages % 2 === 0 ? rawPages : rawPages + 1;
}
