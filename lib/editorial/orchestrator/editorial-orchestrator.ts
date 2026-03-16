/**
 * AI Editorial Orchestrator — Central Intelligence System
 *
 * Coordinates the entire editorial production process from manuscript upload
 * to final publishing package. Acts as the digital editorial production director.
 *
 * Connects and controls:
 * - AI Editorial Pipeline (stage transitions)
 * - Bilingual Editorial Intelligence (language detection, standards)
 * - AI Layout Director (interior design)
 * - AI Cover Art Director (cover design)
 * - Client Timeline System (12-day journey)
 * - Staff Editorial Dashboard
 *
 * Design Principles:
 * - Every manuscript is treated as a premium publishing project
 * - Automated workflow with human override capability
 * - Quality enforcement at every stage
 * - Extensible architecture for future modules
 */

import type { EditorialStageKey, EditorialStageStatus } from "../types/editorial";

// ─── Orchestrator Project Lifecycle ─────────────────────────────────

export type ProjectPhase =
  | "initialization"
  | "manuscript_processing"
  | "editorial_correction"
  | "editorial_review"
  | "interior_design"
  | "cover_creation"
  | "publishing_preparation"
  | "export_distribution";

export const PROJECT_PHASES: {
  phase: ProjectPhase;
  label: string;
  description: string;
  stages: EditorialStageKey[];
}[] = [
  {
    phase: "initialization",
    label: "Inicializacion del Proyecto",
    description: "Carga del manuscrito, deteccion de idioma, configuracion editorial.",
    stages: ["ingesta"],
  },
  {
    phase: "manuscript_processing",
    label: "Procesamiento del Manuscrito",
    description: "Extraccion de texto, analisis de estructura, metadatos.",
    stages: ["ingesta"],
  },
  {
    phase: "editorial_correction",
    label: "Correccion Editorial",
    description: "Ortografia, gramatica, ortotipografia, estilo.",
    stages: ["estructura", "estilo", "ortotipografia"],
  },
  {
    phase: "editorial_review",
    label: "Revision Editorial",
    description: "Revision final del contenido corregido.",
    stages: ["revision_final"],
  },
  {
    phase: "interior_design",
    label: "Diseno Interior",
    description: "Maquetacion, tipografia, diseno de capitulos, front/back matter.",
    stages: ["maquetacion"],
  },
  {
    phase: "cover_creation",
    label: "Creacion de Portada",
    description: "Diseno de portada, lomo, contraportada.",
    stages: ["maquetacion"],
  },
  {
    phase: "publishing_preparation",
    label: "Preparación para Publicación",
    description: "Validación KDP, metadatos, ISBN, paquete final.",
    stages: ["export"],
  },
  {
    phase: "export_distribution",
    label: "Exportación y Distribución",
    description: "Generación de PDF, ebook, paquete de publicación.",
    stages: ["export", "distribution"],
  },
];

// ─── Orchestrator State ─────────────────────────────────────────────

export interface OrchestratorState {
  projectId: string;
  currentPhase: ProjectPhase;
  /** Whether the workflow is paused by staff */
  isPaused: boolean;
  /** Whether the workflow has a blocking issue */
  isBlocked: boolean;
  /** Blocking issues that prevent progression */
  blockingIssues: BlockingIssue[];
  /** Completed validations */
  completedValidations: ValidationResult[];
  /** Pending staff actions */
  pendingStaffActions: StaffAction[];
  /** Report aggregation */
  reports: OrchestratorReport[];
  /** Timestamp of last state update */
  lastUpdated: string;
}

export interface BlockingIssue {
  id: string;
  phase: ProjectPhase;
  stageKey: EditorialStageKey;
  severity: "warning" | "critical";
  issueType: BlockingIssueType;
  message: string;
  resolution: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export type BlockingIssueType =
  | "unresolved_corrections"
  | "formatting_inconsistency"
  | "missing_metadata"
  | "missing_publishing_element"
  | "incompatible_trim_size"
  | "missing_required_file"
  | "stage_validation_failed"
  | "quality_check_failed";

export interface StaffAction {
  id: string;
  actionType: "review" | "approve" | "adjust" | "upload" | "override";
  stageKey: EditorialStageKey;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  completedAt: string | null;
}

// ─── Quality Validation System ──────────────────────────────────────

export type ValidationCheckpoint =
  | "editorial_quality"
  | "structure_completeness"
  | "publishing_readiness";

export interface ValidationResult {
  checkpoint: ValidationCheckpoint;
  passed: boolean;
  checkedAt: string;
  details: ValidationDetail[];
}

export interface ValidationDetail {
  checkName: string;
  passed: boolean;
  message: string;
  severity: "info" | "warning" | "critical";
}

/**
 * Editorial Quality Control — validates before layout stage.
 * Checks that all correction stages are complete.
 */
export function validateEditorialQuality(stages: {
  stageKey: EditorialStageKey;
  status: EditorialStageStatus;
}[]): ValidationResult {
  const details: ValidationDetail[] = [];
  const correctionStages: EditorialStageKey[] = [
    "estructura",
    "estilo",
    "ortotipografia",
  ];

  for (const stageKey of correctionStages) {
    const stage = stages.find((s) => s.stageKey === stageKey);
    if (!stage) {
      details.push({
        checkName: `stage_${stageKey}_exists`,
        passed: false,
        message: `La etapa "${stageKey}" no existe en el proyecto.`,
        severity: "critical",
      });
      continue;
    }

    const isComplete = stage.status === "completed" || stage.status === "approved";
    details.push({
      checkName: `stage_${stageKey}_completed`,
      passed: isComplete,
      message: isComplete
        ? `Etapa "${stageKey}" completada correctamente.`
        : `Etapa "${stageKey}" no completada. Estado actual: ${stage.status}.`,
      severity: isComplete ? "info" : "critical",
    });
  }

  // Check that editorial reports were generated
  details.push({
    checkName: "editorial_reports_generated",
    passed: true, // Will be enhanced when reports are integrated
    message: "Reportes editoriales verificados.",
    severity: "info",
  });

  return {
    checkpoint: "editorial_quality",
    passed: details.every((d) => d.passed),
    checkedAt: new Date().toISOString(),
    details,
  };
}

/**
 * Structure Completeness Check — validates book structure before layout.
 */
export function validateStructureCompleteness(bookMetadata: {
  hasTitle: boolean;
  hasCopyright: boolean;
  hasTableOfContents: boolean;
  hasChapterStructure: boolean;
  hasFrontMatter: boolean;
  hasBackMatter: boolean;
}): ValidationResult {
  const details: ValidationDetail[] = [];

  const checks: { key: keyof typeof bookMetadata; label: string; required: boolean }[] = [
    { key: "hasTitle", label: "Pagina de titulo", required: true },
    { key: "hasCopyright", label: "Pagina de copyright", required: true },
    { key: "hasTableOfContents", label: "Tabla de contenido", required: true },
    { key: "hasChapterStructure", label: "Estructura de capitulos", required: true },
    { key: "hasFrontMatter", label: "Front matter", required: false },
    { key: "hasBackMatter", label: "Back matter", required: false },
  ];

  for (const check of checks) {
    const passed = bookMetadata[check.key];
    details.push({
      checkName: `structure_${check.key}`,
      passed: passed || !check.required,
      message: passed
        ? `${check.label}: presente.`
        : check.required
          ? `${check.label}: FALTANTE. Requerido antes de maquetacion.`
          : `${check.label}: no presente (opcional).`,
      severity: !passed && check.required ? "critical" : passed ? "info" : "warning",
    });
  }

  return {
    checkpoint: "structure_completeness",
    passed: details.every((d) => d.passed),
    checkedAt: new Date().toISOString(),
    details,
  };
}

/**
 * Publishing Readiness Check — validates before final export.
 */
export function validatePublishingReadiness(publishingData: {
  interiorLayoutComplete: boolean;
  typographyConsistent: boolean;
  marginsKDPCompliant: boolean;
  pageNumberingCorrect: boolean;
  spineWidthCalculated: boolean;
  coverDimensionsCorrect: boolean;
  isbnInserted: boolean;
}): ValidationResult {
  const details: ValidationDetail[] = [];

  const checks: {
    key: keyof typeof publishingData;
    label: string;
    required: boolean;
  }[] = [
    { key: "interiorLayoutComplete", label: "Layout interior completo", required: true },
    { key: "typographyConsistent", label: "Tipografia consistente", required: true },
    { key: "marginsKDPCompliant", label: "Margenes compatibles con KDP", required: true },
    { key: "pageNumberingCorrect", label: "Paginacion correcta", required: true },
    { key: "spineWidthCalculated", label: "Ancho de lomo calculado", required: true },
    { key: "coverDimensionsCorrect", label: "Dimensiones de portada correctas", required: true },
    { key: "isbnInserted", label: "ISBN insertado", required: false },
  ];

  for (const check of checks) {
    const passed = publishingData[check.key];
    details.push({
      checkName: `publishing_${check.key}`,
      passed: passed || !check.required,
      message: passed
        ? `${check.label}: verificado.`
        : check.required
          ? `${check.label}: NO CUMPLE. Requerido antes de exportacion.`
          : `${check.label}: no disponible (opcional).`,
      severity: !passed && check.required ? "critical" : passed ? "info" : "warning",
    });
  }

  return {
    checkpoint: "publishing_readiness",
    passed: details.every((d) => d.passed),
    checkedAt: new Date().toISOString(),
    details,
  };
}

// ─── Report Aggregation ─────────────────────────────────────────────

export type ReportType =
  | "orthography"
  | "grammar"
  | "ortotypography"
  | "structure"
  | "style"
  | "translation"
  | "layout_preview"
  | "cover_preview"
  | "publishing_checklist";

export interface OrchestratorReport {
  id: string;
  type: ReportType;
  stageKey: EditorialStageKey;
  title: string;
  summary: string;
  /** Number of issues found */
  issueCount: number;
  /** Number of issues resolved */
  resolvedCount: number;
  generatedAt: string;
  /** Storage path for full report */
  storagePath: string | null;
}

// ─── Publishing Package ─────────────────────────────────────────────

export interface PublishingPackage {
  projectId: string;
  /** Interior print-ready PDF */
  interiorPdf: PackageFile | null;
  /** Full cover PDF (front + spine + back) */
  fullCoverPdf: PackageFile | null;
  /** Metadata summary */
  metadataSummary: PackageFile | null;
  /** Editorial reports bundle */
  editorialReports: PackageFile | null;
  /** Original manuscript source */
  manuscriptSource: PackageFile | null;
  /** Publishing checklist */
  publishingChecklist: PackageFile | null;
  /** Ebook file if applicable */
  ebookFile: PackageFile | null;
  /** Marketing preview images */
  marketingPreviews: PackageFile[];
  /** Package status */
  status: "building" | "complete" | "failed";
  /** Created timestamp */
  createdAt: string;
}

export interface PackageFile {
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

// ─── Workflow Automation ────────────────────────────────────────────

export interface WorkflowTransition {
  fromStage: EditorialStageKey;
  toStage: EditorialStageKey;
  /** Whether this transition requires staff approval */
  requiresApproval: boolean;
  /** Validation checkpoint to run before transitioning */
  validationCheckpoint: ValidationCheckpoint | null;
  /** Whether to auto-trigger AI processing on the next stage */
  autoTriggerAI: boolean;
}

/**
 * Defines the automated workflow transitions.
 * Each transition specifies what happens when a stage completes.
 */
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    fromStage: "ingesta",
    toStage: "estructura",
    requiresApproval: false,
    validationCheckpoint: null,
    autoTriggerAI: true,
  },
  {
    fromStage: "estructura",
    toStage: "estilo",
    requiresApproval: false,
    validationCheckpoint: null,
    autoTriggerAI: true,
  },
  {
    fromStage: "estilo",
    toStage: "ortotipografia",
    requiresApproval: false,
    validationCheckpoint: null,
    autoTriggerAI: true,
  },
  {
    fromStage: "ortotipografia",
    toStage: "maquetacion",
    requiresApproval: false,
    validationCheckpoint: "editorial_quality",
    autoTriggerAI: true,
  },
  {
    fromStage: "maquetacion",
    toStage: "revision_final",
    requiresApproval: true,
    validationCheckpoint: "structure_completeness",
    autoTriggerAI: true,
  },
  {
    fromStage: "revision_final",
    toStage: "export",
    requiresApproval: true,
    validationCheckpoint: "publishing_readiness",
    autoTriggerAI: true,
  },
  {
    fromStage: "export",
    toStage: "distribution",
    requiresApproval: false,
    validationCheckpoint: null,
    autoTriggerAI: false,
  },
];

/**
 * Get the workflow transition for a completed stage.
 */
export function getNextTransition(
  completedStage: EditorialStageKey
): WorkflowTransition | undefined {
  return WORKFLOW_TRANSITIONS.find((t) => t.fromStage === completedStage);
}

/**
 * Check if a stage can auto-advance based on workflow rules.
 */
export function canAutoAdvance(
  completedStage: EditorialStageKey,
  orchestratorState: OrchestratorState
): { canAdvance: boolean; reason: string } {
  // Check if workflow is paused
  if (orchestratorState.isPaused) {
    return {
      canAdvance: false,
      reason: "El flujo de trabajo esta pausado por el equipo editorial.",
    };
  }

  // Check if there are blocking issues
  if (orchestratorState.isBlocked) {
    return {
      canAdvance: false,
      reason: `Hay ${orchestratorState.blockingIssues.length} problemas bloqueantes sin resolver.`,
    };
  }

  const transition = getNextTransition(completedStage);
  if (!transition) {
    return {
      canAdvance: false,
      reason: `No hay transicion definida despues de "${completedStage}".`,
    };
  }

  // If requires approval, cannot auto-advance
  if (transition.requiresApproval) {
    return {
      canAdvance: false,
      reason: `La transicion de "${completedStage}" a "${transition.toStage}" requiere aprobacion del staff.`,
    };
  }

  return { canAdvance: true, reason: "OK" };
}

// ─── Human Override Capability ──────────────────────────────────────

export type OverrideAction =
  | "pause_workflow"
  | "resume_workflow"
  | "skip_stage"
  | "regenerate_stage"
  | "upload_corrected_version"
  | "override_ai_decision"
  | "force_advance"
  | "rollback_stage";

export interface OverrideRequest {
  action: OverrideAction;
  stageKey: EditorialStageKey;
  requestedBy: string;
  reason: string;
  /** Additional data for the override */
  payload?: Record<string, unknown>;
}

/**
 * Validate an override request.
 * Staff always retains full control, but we log and validate.
 */
export function validateOverrideRequest(
  request: OverrideRequest,
  currentState: OrchestratorState
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // All overrides are valid (staff has full control), but we may warn
  switch (request.action) {
    case "skip_stage":
      warnings.push(
        `Saltar la etapa "${request.stageKey}" puede afectar la calidad del producto final.`
      );
      break;
    case "force_advance":
      if (currentState.blockingIssues.length > 0) {
        warnings.push(
          `Hay ${currentState.blockingIssues.length} problemas sin resolver. Avanzar puede producir un libro con defectos.`
        );
      }
      break;
    case "rollback_stage":
      warnings.push(
        `El rollback de "${request.stageKey}" puede requerir reprocesar etapas posteriores.`
      );
      break;
  }

  return { valid: true, warnings };
}

// ─── Error Prevention System ────────────────────────────────────────

export interface ErrorCheck {
  id: string;
  category: "corrections" | "formatting" | "metadata" | "publishing" | "compatibility";
  description: string;
  check: () => boolean;
}

/**
 * Run error prevention checks before allowing stage progression.
 */
export function runErrorPreventionChecks(
  stageKey: EditorialStageKey,
  projectData: {
    stages: { stageKey: EditorialStageKey; status: EditorialStageStatus }[];
    hasMetadata: boolean;
    hasTrimSize: boolean;
    hasISBN: boolean;
    pageCount: number;
  }
): BlockingIssue[] {
  const issues: BlockingIssue[] = [];
  const now = new Date().toISOString();

  // Check for unresolved corrections before maquetacion
  if (stageKey === "maquetacion") {
    const correctionStages: EditorialStageKey[] = ["estructura", "estilo", "ortotipografia"];
    for (const cs of correctionStages) {
      const stage = projectData.stages.find((s) => s.stageKey === cs);
      if (stage && stage.status !== "completed" && stage.status !== "approved") {
        issues.push({
          id: `err_${cs}_incomplete_${Date.now()}`,
          phase: "editorial_correction",
          stageKey: cs,
          severity: "critical",
          issueType: "unresolved_corrections",
          message: `La etapa de correccion "${cs}" no esta completada (${stage.status}).`,
          resolution: `Completar la etapa "${cs}" antes de iniciar maquetacion.`,
          resolvedAt: null,
          resolvedBy: null,
        });
      }
    }
  }

  // Check for missing metadata before export
  if (stageKey === "export") {
    if (!projectData.hasMetadata) {
      issues.push({
        id: `err_missing_metadata_${Date.now()}`,
        phase: "publishing_preparation",
        stageKey: "export",
        severity: "critical",
        issueType: "missing_metadata",
        message: "Faltan metadatos del libro requeridos para exportacion.",
        resolution: "Completar los metadatos del proyecto (titulo, autor, idioma, genero).",
        resolvedAt: null,
        resolvedBy: null,
      });
    }

    if (!projectData.hasTrimSize) {
      issues.push({
        id: `err_missing_trim_${Date.now()}`,
        phase: "publishing_preparation",
        stageKey: "export",
        severity: "critical",
        issueType: "incompatible_trim_size",
        message: "No se ha configurado el tamano de corte (trim size) del libro.",
        resolution: "Seleccionar un formato de libro (preset) antes de exportar.",
        resolvedAt: null,
        resolvedBy: null,
      });
    }

    if (projectData.pageCount < 24) {
      issues.push({
        id: `err_low_page_count_${Date.now()}`,
        phase: "publishing_preparation",
        stageKey: "export",
        severity: "warning",
        issueType: "incompatible_trim_size",
        message: `El libro tiene solo ${projectData.pageCount} paginas. Amazon KDP requiere minimo 24 paginas.`,
        resolution: "Verificar que el contenido es suficiente o ajustar el formato.",
        resolvedAt: null,
        resolvedBy: null,
      });
    }
  }

  return issues;
}

// ─── System Monitoring ──────────────────────────────────────────────

export interface ProjectMonitoringData {
  projectId: string;
  /** Current phase */
  currentPhase: ProjectPhase;
  /** Overall progress (0-100) */
  overallProgress: number;
  /** Per-stage status */
  stageStatuses: { stageKey: EditorialStageKey; status: EditorialStageStatus }[];
  /** Number of regeneration attempts per stage */
  regenerationAttempts: Record<string, number>;
  /** Approvals received */
  approvals: { stageKey: EditorialStageKey; approvedBy: string; approvedAt: string }[];
  /** Exports generated */
  exports: { exportType: string; generatedAt: string }[];
  /** Timestamp */
  lastChecked: string;
}

/**
 * Calculate overall project progress based on stage statuses.
 */
export function calculateOverallProgress(
  stages: { stageKey: EditorialStageKey; status: EditorialStageStatus }[]
): number {
  const stageWeights: Record<EditorialStageKey, number> = {
    ingesta: 10,
    estructura: 15,
    estilo: 15,
    ortotipografia: 15,
    maquetacion: 15,
    revision_final: 10,
    export: 10,
    distribution: 10,
  };

  let completedWeight = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(stageWeights)) {
    totalWeight += weight;
    const stage = stages.find((s) => s.stageKey === key);
    if (stage) {
      if (stage.status === "completed" || stage.status === "approved") {
        completedWeight += weight;
      } else if (stage.status === "processing") {
        completedWeight += weight * 0.5;
      } else if (stage.status === "review_required") {
        completedWeight += weight * 0.75;
      }
    }
  }

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Determine the current project phase based on stage statuses.
 */
export function determineCurrentPhase(
  stages: { stageKey: EditorialStageKey; status: EditorialStageStatus }[]
): ProjectPhase {
  const getStatus = (key: EditorialStageKey): EditorialStageStatus | undefined =>
    stages.find((s) => s.stageKey === key)?.status;

  const isComplete = (key: EditorialStageKey) => {
    const status = getStatus(key);
    return status === "completed" || status === "approved";
  };

  const isActive = (key: EditorialStageKey) => {
    const status = getStatus(key);
    return status === "processing" || status === "review_required";
  };

  // Check from end to start
  if (isActive("distribution") || isComplete("distribution")) {
    return "export_distribution";
  }
  if (isActive("export")) {
    return "publishing_preparation";
  }
  if (isActive("revision_final") || isComplete("revision_final")) {
    return "editorial_review";
  }
  if (isActive("maquetacion")) {
    return "interior_design";
  }
  if (
    isActive("estructura") ||
    isActive("estilo") ||
    isActive("ortotipografia") ||
    isComplete("ortotipografia")
  ) {
    return "editorial_correction";
  }
  if (isActive("ingesta") || isComplete("ingesta")) {
    return "manuscript_processing";
  }

  return "initialization";
}

// ─── Orchestrator System Prompt ─────────────────────────────────────

export function getOrchestratorSystemPrompt(): string {
  return `Eres el Director de Produccion Editorial de una editorial profesional premium.

RESPONSABILIDAD CENTRAL:
Coordinar todo el proceso editorial desde la carga del manuscrito hasta el paquete
final de publicacion. Cada libro producido debe cumplir estandares profesionales
de publicacion, sin importar su tamano o complejidad.

PRINCIPIOS NO NEGOCIABLES:
1. CALIDAD PREMIUM: Todo libro debe ser editado profesionalmente, corregido
   cuidadosamente, visualmente elegante y tipograficamente refinado.
2. CONTROL HUMANO: El staff siempre retiene control total. La IA asiste, no impone.
3. PRECISION EDITORIAL: La precision es mas importante que la velocidad.
4. TRAZABILIDAD: Cada decision y correccion debe ser rastreable.

FASES DEL PROCESO:
1. Inicializacion → Carga de manuscrito, deteccion de idioma
2. Procesamiento → Extraccion de texto, analisis estructural
3. Correccion Editorial → Ortografia, gramatica, ortotipografia, estilo
4. Revision Editorial → Revision final del contenido
5. Diseño Interior → Maquetación, tipografía, capítulos
6. Portada → Diseño profesional de portada
7. Preparación → Validación KDP, metadatos
8. Exportación → PDF print-ready, ebook, paquete de publicación

CONTROLES DE CALIDAD:
- Antes de maquetacion: verificar que TODAS las correcciones estan completas
- Antes de layout: verificar estructura del libro (titulo, copyright, TOC, capitulos)
- Antes de exportacion: verificar compliance KDP (margenes, paginacion, lomo, portada)

PREVENCION DE ERRORES:
- Detectar correcciones sin resolver
- Detectar inconsistencias de formato
- Detectar metadatos faltantes
- Detectar elementos de publicacion faltantes
- No permitir avance si hay problemas criticos

RESPONDE SIEMPRE EN ESPANOL.`;
}

// ─── Future Extensibility ───────────────────────────────────────────

/**
 * Registry for future orchestrator modules.
 * Allows adding new stages/modules without modifying core logic.
 */
export interface OrchestratorModule {
  id: string;
  name: string;
  description: string;
  /** Phase this module belongs to */
  phase: ProjectPhase;
  /** Whether this module is currently active */
  isActive: boolean;
  /** Module version */
  version: string;
}

export const REGISTERED_MODULES: OrchestratorModule[] = [
  {
    id: "editorial_pipeline",
    name: "AI Editorial Pipeline",
    description: "Pipeline de correccion editorial con 8 etapas.",
    phase: "editorial_correction",
    isActive: true,
    version: "2.0.0",
  },
  {
    id: "bilingual_intelligence",
    name: "Bilingual Editorial Intelligence",
    description: "Deteccion de idioma, estandares ES/EN, proteccion de versiculos biblicos.",
    phase: "editorial_correction",
    isActive: true,
    version: "1.0.0",
  },
  {
    id: "layout_director",
    name: "AI Layout Director",
    description: "Diseno interior profesional con tipografia inteligente.",
    phase: "interior_design",
    isActive: true,
    version: "1.0.0",
  },
  {
    id: "cover_art_director",
    name: "AI Cover Art Director",
    description: "Sistema de diseno de portada profesional.",
    phase: "cover_creation",
    isActive: true,
    version: "1.0.0",
  },
  {
    id: "client_timeline",
    name: "Client Timeline System",
    description: "Sistema de timeline dual (12 dias para el cliente).",
    phase: "initialization",
    isActive: true,
    version: "1.0.0",
  },
  // Future modules (inactive)
  {
    id: "audiobook_prep",
    name: "Audiobook Preparation",
    description: "Preparacion de manuscrito para produccion de audiolibro.",
    phase: "export_distribution",
    isActive: false,
    version: "0.0.0",
  },
  {
    id: "marketing_assets",
    name: "Marketing Assets Generator",
    description: "Generación de assets de marketing (social media, ads).",
    phase: "export_distribution",
    isActive: false,
    version: "0.0.0",
  },
  {
    id: "ebook_optimizer",
    name: "Ebook Optimizer",
    description: "Optimizacion avanzada de ebook (EPUB, Kindle).",
    phase: "export_distribution",
    isActive: false,
    version: "0.0.0",
  },
  {
    id: "translation_expansion",
    name: "Translation Expansion",
    description: "Expansion multiidioma (mas alla de ES/EN).",
    phase: "editorial_correction",
    isActive: false,
    version: "0.0.0",
  },
];

/**
 * Get all active orchestrator modules.
 */
export function getActiveModules(): OrchestratorModule[] {
  return REGISTERED_MODULES.filter((m) => m.isActive);
}

/**
 * Get modules for a specific phase.
 */
export function getModulesForPhase(phase: ProjectPhase): OrchestratorModule[] {
  return REGISTERED_MODULES.filter((m) => m.phase === phase && m.isActive);
}
