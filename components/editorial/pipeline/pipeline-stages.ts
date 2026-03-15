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
}

export type UIStageStatus = "completed" | "active" | "pending" | "blocked";

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
}

// ─── The 11 UI stages ───────────────────────────────────────────────────

export const UI_PIPELINE_STAGES: UIPipelineStage[] = [
  {
    id: "manuscript",
    order: 1,
    label: "Manuscript",
    shortLabel: "Manuscript",
    description:
      "Upload and validate the original manuscript. Configure project settings and editorial admission.",
    dbPhases: ["intake"],
    outputs: [
      "Original manuscript file",
      "Technical validation report",
      "Editorial admission decision",
      "Project configuration",
    ],
  },
  {
    id: "ai-analysis",
    order: 2,
    label: "AI Analysis",
    shortLabel: "AI Analysis",
    description:
      "AI-powered analysis of manuscript structure, style, grammar, and potential issues.",
    dbPhases: ["editorial_analysis"],
    outputs: [
      "Structural report",
      "Style report",
      "Grammar findings",
      "AI recommendations",
    ],
  },
  {
    id: "structural-editing",
    order: 3,
    label: "Structural Editing",
    shortLabel: "Structural",
    description:
      "Structural editing with AI suggestions. Review and approve structural changes.",
    dbPhases: ["structural_editing"],
    outputs: [
      "Structural edit document",
      "Change report",
      "Structural approval",
    ],
  },
  {
    id: "line-editing",
    order: 4,
    label: "Line Editing",
    shortLabel: "Line Edit",
    description:
      "Line-by-line editing for voice consistency, style refinement, and flow.",
    dbPhases: ["line_editing"],
    outputs: [
      "Line-edited manuscript",
      "Voice consistency report",
      "Style refinement notes",
    ],
  },
  {
    id: "copyediting",
    order: 5,
    label: "Copyediting",
    shortLabel: "Copyedit",
    description:
      "Grammar correction, orthotypography review, references validation, and text finalization.",
    dbPhases: ["copyediting", "text_finalization"],
    outputs: [
      "Corrected manuscript",
      "Orthotypography report",
      "References validation",
      "Final locked text",
      "Master manuscript",
    ],
  },
  {
    id: "book-specs",
    order: 6,
    label: "Book Specifications",
    shortLabel: "Specs",
    description:
      "Configure book format, trim size, paper type, margins, and Amazon KDP settings.",
    dbPhases: ["book_specifications"],
    outputs: [
      "Trim size configuration",
      "Paper and binding specs",
      "Layout parameters",
      "Pagination estimate",
    ],
  },
  {
    id: "layout",
    order: 7,
    label: "Layout",
    shortLabel: "Layout",
    description:
      "Interior layout design and book formatting for print production.",
    dbPhases: ["book_production"],
    stageFilter: ["layout_analysis_task", "book_layout"],
    outputs: ["Layout analysis", "Formatted interior PDF"],
  },
  {
    id: "cover-design",
    order: 8,
    label: "Cover Design",
    shortLabel: "Cover",
    description:
      "Cover design creation, approval, and proof generation.",
    dbPhases: ["book_production"],
    stageFilter: ["cover_design", "cover_approval", "proof_generation"],
    outputs: ["Cover design", "Cover approval", "Print-ready proof"],
  },
  {
    id: "final-proof",
    order: 9,
    label: "Final Proof",
    shortLabel: "Proof",
    description:
      "Final proof review, corrections, and production approval before publishing.",
    dbPhases: ["final_proof"],
    outputs: [
      "Final proof document",
      "Proof corrections",
      "Production approval",
    ],
  },
  {
    id: "publishing",
    order: 10,
    label: "Publishing",
    shortLabel: "Publishing",
    description:
      "Generate metadata, register ISBN, set pricing strategy, and configure distribution.",
    dbPhases: ["publishing_prep"],
    outputs: [
      "Metadata package",
      "ISBN registration",
      "Pricing configuration",
      "Distribution setup",
    ],
  },
  {
    id: "distribution",
    order: 11,
    label: "Distribution",
    shortLabel: "Distribution",
    description:
      "Export validation, publish to platforms, and activate on marketplaces.",
    dbPhases: ["distribution"],
    outputs: [
      "Export validation",
      "Platform publishing",
      "Marketplace activation",
    ],
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

    // Check if the current workflow stage falls within this UI stage
    const currentPhaseMatches = uiStage.dbPhases.includes(
      detail.workflow.current_phase
    );
    const currentStageMatches =
      currentPhaseMatches &&
      (!uiStage.stageFilter ||
        uiStage.stageFilter.includes(detail.workflow.current_stage));

    let status: UIStageStatus;
    if (allCompleted) {
      status = "completed";
    } else if (hasBlocked) {
      status = "blocked";
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
    };
  });
}
