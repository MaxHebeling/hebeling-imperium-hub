/**
 * UI Pipeline Stage definitions.
 *
 * Maps the user's desired 11-stage editorial pipeline to the underlying
 * database phases. Key transformations:
 *   - "Copyediting" merges DB phases: copyediting + text_finalization
 *   - "Layout" and "Cover Design" split DB phase: book_production
 *
 * The backend is NOT modified — this is a pure UI abstraction layer.
 */

import type {
  WorkflowPhaseKey,
  WorkflowStageKey,
  ProjectWorkflowDetail,
} from "@/lib/editorial/types/workflow";

// ─── UI Stage type ──────────────────────────────────────────────────────

export interface UIPipelineStage {
  id: string;
  order: number;
  label: string;
  shortLabel: string;
  description: string;
  /** Which DB phase(s) feed into this UI stage */
  dbPhases: WorkflowPhaseKey[];
  /** If set, only include these sub-stages from the DB phases */
  stageFilter?: WorkflowStageKey[];
  /** Expected outputs for this stage */
  outputs: string[];
  /** Primary output artifact name */
  mainArtifact: string;
}

export type UIStageStatus = "completed" | "active" | "needs_review" | "pending" | "blocked";

export interface UISubstage {
  stageKey: string;
  name: string;
  isAiStage: boolean;
  requiresApproval: boolean;
  humanRequired: boolean;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  /** The DB phase this sub-stage belongs to (needed for API calls) */
  dbPhaseKey: WorkflowPhaseKey;
}

export interface UIStageData {
  stage: UIPipelineStage;
  status: UIStageStatus;
  substages: UISubstage[];
  completedCount: number;
  totalCount: number;
  isCurrent: boolean;
  /** Editor who approved / is working on this stage (from DB approved_by) */
  assignedEditor: string | null;
}

// ─── The 11 UI stages ───────────────────────────────────────────────────

export const UI_PIPELINE_STAGES: UIPipelineStage[] = [
  {
    id: "manuscript",
    order: 1,
    label: "Manuscrito",
    shortLabel: "Manuscrito",
    description:
      "Subir y validar el manuscrito original. Configurar ajustes del proyecto y admisión editorial.",
    dbPhases: ["intake"],
    outputs: [
      "Archivo del manuscrito original",
      "Reporte de validación técnica",
      "Decisión de admisión editorial",
      "Configuración del proyecto",
    ],
    mainArtifact: "Manuscrito Original",
  },
  {
    id: "ai-analysis",
    order: 2,
    label: "Análisis IA",
    shortLabel: "Análisis IA",
    description:
      "Análisis con IA de estructura, estilo, gramática y problemas potenciales del manuscrito.",
    dbPhases: ["editorial_analysis"],
    outputs: [
      "Reporte estructural",
      "Reporte de estilo",
      "Hallazgos gramaticales",
      "Recomendaciones IA",
    ],
    mainArtifact: "Reporte Editorial IA",
  },
  {
    id: "structural-editing",
    order: 3,
    label: "Edición Estructural",
    shortLabel: "Estructura",
    description:
      "Edición estructural con sugerencias de IA. Revisar y aprobar cambios estructurales.",
    dbPhases: ["structural_editing"],
    outputs: [
      "Documento de edición estructural",
      "Reporte de cambios",
      "Aprobación estructural",
    ],
    mainArtifact: "Edición Estructural",
  },
  {
    id: "line-editing",
    order: 4,
    label: "Edición de Línea",
    shortLabel: "Línea",
    description:
      "Edición línea por línea para consistencia de voz, refinamiento de estilo y fluidez.",
    dbPhases: ["line_editing"],
    outputs: [
      "Manuscrito editado línea por línea",
      "Reporte de consistencia de voz",
      "Notas de refinamiento de estilo",
    ],
    mainArtifact: "Manuscrito Editado",
  },
  {
    id: "copyediting",
    order: 5,
    label: "Corrección de Estilo",
    shortLabel: "Corrección",
    description:
      "Corrección gramatical, revisión ortotipográfica, validación de referencias y finalización del texto.",
    dbPhases: ["copyediting", "text_finalization"],
    outputs: [
      "Manuscrito corregido",
      "Reporte ortotipográfico",
      "Validación de referencias",
      "Texto final bloqueado",
      "Manuscrito maestro",
    ],
    mainArtifact: "Manuscrito Maestro",
  },
  {
    id: "book-specs",
    order: 6,
    label: "Especificaciones del Libro",
    shortLabel: "Espec.",
    description:
      "Configurar formato del libro, tamaño de corte, tipo de papel, márgenes y ajustes Amazon KDP.",
    dbPhases: ["book_specifications"],
    outputs: [
      "Configuración de tamaño de corte",
      "Especificaciones de papel y encuadernación",
      "Parámetros de maquetación",
      "Estimación de paginación",
    ],
    mainArtifact: "Ficha de Especificaciones",
  },
  {
    id: "layout",
    order: 7,
    label: "Maquetación",
    shortLabel: "Maquetación",
    description:
      "Diseño interior y maquetación del libro para producción impresa.",
    dbPhases: ["book_production"],
    stageFilter: ["layout_analysis_task", "book_layout"],
    outputs: ["Análisis de maquetación", "PDF interior formateado"],
    mainArtifact: "PDF Interior",
  },
  {
    id: "cover-design",
    order: 8,
    label: "Diseño de Portada",
    shortLabel: "Portada",
    description:
      "Creación del diseño de portada, aprobación y generación de prueba.",
    dbPhases: ["book_production"],
    stageFilter: ["cover_design", "cover_approval", "proof_generation"],
    outputs: ["Diseño de portada", "Aprobación de portada", "Prueba lista para impresión"],
    mainArtifact: "Diseño de Portada",
  },
  {
    id: "final-proof",
    order: 9,
    label: "Prueba Final",
    shortLabel: "Prueba",
    description:
      "Revisión de prueba final, correcciones y aprobación de producción antes de publicar.",
    dbPhases: ["final_proof"],
    outputs: [
      "Documento de prueba final",
      "Correcciones de prueba",
      "Aprobación de producción",
    ],
    mainArtifact: "Prueba Final",
  },
  {
    id: "publishing",
    order: 10,
    label: "Publicación",
    shortLabel: "Publicación",
    description:
      "Generar metadatos, registrar ISBN, definir estrategia de precios y configurar distribución.",
    dbPhases: ["publishing_prep"],
    outputs: [
      "Paquete de metadatos",
      "Registro de ISBN",
      "Configuración de precios",
      "Configuración de distribución",
    ],
    mainArtifact: "Paquete de Publicación",
  },
  {
    id: "distribution",
    order: 11,
    label: "Distribución",
    shortLabel: "Distribución",
    description:
      "Validación de exportación, publicar en plataformas y activar en marketplaces.",
    dbPhases: ["distribution"],
    outputs: [
      "Validación de exportación",
      "Publicación en plataformas",
      "Activación en marketplaces",
    ],
    mainArtifact: "Listados Activos",
  },
];

// ─── Transform DB workflow data into UI stages ──────────────────────────

export function mapWorkflowToUIStages(
  detail: ProjectWorkflowDetail
): UIStageData[] {
  return UI_PIPELINE_STAGES.map((uiStage) => {
    // Gather sub-stages from all mapped DB phases
    const substages: UISubstage[] = [];

    for (const dbPhaseKey of uiStage.dbPhases) {
      const dbPhase = detail.phases.find(
        (p) => p.phase.phase_key === dbPhaseKey
      );
      if (!dbPhase) continue;

      for (const s of dbPhase.stages) {
        // If stageFilter is set, only include matching stages
        if (
          uiStage.stageFilter &&
          !uiStage.stageFilter.includes(
            s.definition.stage_key as WorkflowStageKey
          )
        ) {
          continue;
        }

        substages.push({
          stageKey: s.definition.stage_key,
          name: s.definition.name,
          isAiStage: s.definition.is_ai_stage,
          requiresApproval: s.definition.requires_approval,
          humanRequired: s.definition.human_required,
          status: s.status?.status ?? "pending",
          startedAt: s.status?.started_at ?? null,
          completedAt: s.status?.completed_at ?? null,
          dbPhaseKey,
        });
      }
    }

    const completedCount = substages.filter(
      (s) => s.status === "completed"
    ).length;
    const totalCount = substages.length;
    const allCompleted = totalCount > 0 && completedCount === totalCount;
    const hasBlocked = substages.some((s) => s.status === "blocked");
    const hasNeedsReview = substages.some((s) => s.status === "needs_review");

    // Check if the current workflow stage falls within this UI stage
    const currentPhaseMatches = uiStage.dbPhases.includes(
      detail.workflow.current_phase
    );
    const currentStageMatches =
      currentPhaseMatches &&
      (!uiStage.stageFilter ||
        uiStage.stageFilter.includes(detail.workflow.current_stage));

    // Derive the assigned editor from approved_by on any sub-stage in this UI stage
    let assignedEditor: string | null = null;
    for (const dbPhaseKey of uiStage.dbPhases) {
      const dbPhase = detail.phases.find(
        (p) => p.phase.phase_key === dbPhaseKey
      );
      if (!dbPhase) continue;
      for (const s of dbPhase.stages) {
        if (s.status?.approved_by) {
          assignedEditor = s.status.approved_by;
          break;
        }
      }
      if (assignedEditor) break;
    }

    let status: UIStageStatus;
    if (allCompleted) {
      status = "completed";
    } else if (hasBlocked) {
      status = "blocked";
    } else if (hasNeedsReview && currentStageMatches) {
      status = "needs_review";
    } else if (currentStageMatches) {
      status = "active";
    } else {
      status = "pending";
    }

    return {
      stage: uiStage,
      status,
      substages,
      completedCount,
      totalCount,
      isCurrent: currentStageMatches,
      assignedEditor,
    };
  });
}
