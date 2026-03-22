import { NextRequest, NextResponse } from "next/server";
import {
  getEditorialProject,
  getProjectStages,
  getProjectFiles,
  getProjectComments,
  getProjectExports,
  getProjectJobs,
  getProjectWorkflow,
  getCurrentWorkflowAssets,
  getLatestStageRunForWorkflowStage,
  getStageRunApprovals,
  getStageRunFindings,
} from "@/lib/editorial/db/queries";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import {
  extractEditorialInterventionLevelFromPipelineContext,
  extractSpecialKdpFormatEnabledFromPipelineContext,
  extractTypographyPresetIdFromPipelineContext,
} from "@/lib/editorial/pipeline/editorial-policy";
import { getBookSpecifications } from "@/lib/editorial/workflow/professional";
import { mapLegacyStageToWorkflowStage } from "@/lib/editorial/stage-engine/service";
import { evaluateStageCanComplete } from "@/lib/editorial/workflow";
import { EDITORIAL_WORKFLOW_STAGE_MAP } from "@/lib/editorial/stage-engine/definitions";
import {
  EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE,
  type EditorialWorkflowState,
} from "@/lib/editorial/foundation";
import {
  getReinoEditorialDefaultFontSize,
  getReinoEditorialDefaultLineSpacing,
  getReinoEditorialTypographyPreset,
} from "@/lib/editorial/kdp";

type ActiveEditorialWorkflowState =
  (typeof EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE)[number];

const WORKFLOW_STATE_LABELS: Record<EditorialWorkflowState, string> = {
  received: "Recepción",
  normalized: "Preprocesamiento",
  analyzed: "Análisis editorial",
  editing_planned: "Plan de edición",
  content_edited: "Edición de contenido",
  proofread: "Corrección lingüística",
  validated: "Validación semántica",
  metadata_ready: "Metadata comercial",
  cover_ready: "Portadas",
  layout_ready: "Maquetación",
  qa_passed: "Control de calidad",
  packaged: "Empaquetado",
  published: "Publicación",
  marketed: "Marketing",
};

const WORKFLOW_STATE_DESCRIPTIONS: Record<EditorialWorkflowState, string> = {
  received: "Proyecto creado y manuscrito recibido.",
  normalized: "Texto extraído, limpiado y estructurado.",
  analyzed: "Diagnóstico editorial y scoring generados.",
  editing_planned: "Estrategia de edición definida.",
  content_edited: "Manuscrito reescrito con mejoras de contenido.",
  proofread: "Gramática, ortografía y estilo corregidos.",
  validated: "Consistencia semántica y entidades verificadas.",
  metadata_ready: "Metadata editorial y comercial lista.",
  cover_ready: "Conceptos de portada preparados.",
  layout_ready: "PDF y EPUB generados.",
  qa_passed: "Revisión final técnica superada.",
  packaged: "Assets empaquetados para distribución.",
  published: "Libro publicado en plataformas.",
  marketed: "Kit comercial y campañas generadas.",
};

const WORKFLOW_ASSET_KIND_BY_STATE: Partial<Record<EditorialWorkflowState, string>> = {
  received: "manuscript",
  normalized: "normalized_text",
  analyzed: "analysis_output",
  editing_planned: "editing_plan",
  content_edited: "edited_manuscript",
  proofread: "proofread_manuscript",
  validated: "validated_manuscript",
  metadata_ready: "metadata_asset",
  cover_ready: "cover_asset",
  layout_ready: "layout_asset",
  qa_passed: "qa_asset",
  packaged: "package_asset",
  published: "publication_asset",
  marketed: "marketing_asset",
};

const LEGACY_STAGE_TO_WORKFLOW_STATE: Record<EditorialStageKey, EditorialWorkflowState> = {
  recepcion: "received",
  preparacion: "analyzed",
  edicion_editorial: "editing_planned",
  correccion_linguistica: "content_edited",
  preprensa_kdp: "proofread",
  validacion_paginas: "validated",
  briefing_portada: "validated",
  generacion_portada: "validated",
  maquetacion_interior: "validated",
  marketing_editorial: "qa_passed",
  entrega_final: "qa_passed",
};

function normalizeWorkflowState(
  state: EditorialWorkflowState | null
): ActiveEditorialWorkflowState | null {
  if (!state) {
    return null;
  }

  if (state === "metadata_ready" || state === "cover_ready") {
    return "validated";
  }

  if (state === "packaged" || state === "published" || state === "marketed") {
    return "qa_passed";
  }

  return state as ActiveEditorialWorkflowState;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const [project, stages, files, comments, exports, jobs, workflow, workflowAssets, bookSpecs] = await Promise.all([
      getEditorialProject(projectId),
      getProjectStages(projectId),
      getProjectFiles(projectId),
      getProjectComments(projectId),
      getProjectExports(projectId),
      getProjectJobs(projectId),
      getProjectWorkflow(projectId),
      getCurrentWorkflowAssets(projectId),
      getBookSpecifications(projectId),
    ]);

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const workflowStageKey = mapLegacyStageToWorkflowStage(project.current_stage);
    const currentStageRun = await getLatestStageRunForWorkflowStage(projectId, workflowStageKey);
    const [currentStageFindings, currentStageApprovals] = currentStageRun
      ? await Promise.all([
          getStageRunFindings(currentStageRun.id),
          getStageRunApprovals(currentStageRun.id),
        ])
      : [[], []];
    const gateEvaluation = await evaluateStageCanComplete({
      orgId: project.org_id,
      projectId,
      stageKey: project.current_stage,
    });

    const latestFile = files[0] ?? null;
    const projectStatus = normalizeWorkflowState(
      (project as { current_status?: EditorialWorkflowState | null }).current_status ??
        null
    );
    const resolvedWorkflowState = normalizeWorkflowState(
      (workflow?.current_state as EditorialWorkflowState | null) ??
        projectStatus ??
        LEGACY_STAGE_TO_WORKFLOW_STATE[project.current_stage]
    );
    const currentWorkflowIndex =
      resolvedWorkflowState !== null
        ? EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE.indexOf(resolvedWorkflowState)
        : -1;
    const nextTechnicalStageIndex =
      currentWorkflowIndex === -1
        ? 0
        : currentWorkflowIndex >= EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE.length - 1
          ? -1
          : currentWorkflowIndex + 1;
    const workflowAssetMap = new Map(
      workflowAssets.map((asset) => [asset.asset_kind, asset])
    );
    const technicalStages = EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE.map((state, index) => {
      const assetKind = WORKFLOW_ASSET_KIND_BY_STATE[state] ?? null;
      const asset = assetKind ? workflowAssetMap.get(assetKind) ?? null : null;
      const status =
        currentWorkflowIndex === -1
          ? state === "received"
            ? "current"
            : "pending"
          : nextTechnicalStageIndex === -1
            ? "completed"
            : index <= currentWorkflowIndex
            ? "completed"
            : index === nextTechnicalStageIndex
              ? "current"
              : "pending";

      return {
        key: state,
        label: WORKFLOW_STATE_LABELS[state],
        description: WORKFLOW_STATE_DESCRIPTIONS[state],
        status,
        asset_kind: assetKind,
        asset_id: asset?.id ?? null,
        asset_version: asset?.version ?? null,
        asset_label: asset?.source_label ?? null,
        updated_at: asset?.updated_at ?? null,
      };
    });
    const typographyPresetId = extractTypographyPresetIdFromPipelineContext(
      (project as { pipeline_context?: unknown }).pipeline_context
    );
    const typographyPreset = getReinoEditorialTypographyPreset(typographyPresetId);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        author_name: project.author_name,
        current_stage: project.current_stage,
        status:
          workflow?.current_state ??
          (project as { current_status?: string | null }).current_status ??
          project.status,
        progress_percent: project.progress_percent,
        client_id: project.client_id ?? null,
        book_size: bookSpecs?.trim_size_id ?? project.book_size ?? null,
        special_kdp_format_enabled:
          extractSpecialKdpFormatEnabledFromPipelineContext(
            (project as { pipeline_context?: unknown }).pipeline_context
          ),
        editorial_intervention_level:
          extractEditorialInterventionLevelFromPipelineContext(
            (project as { pipeline_context?: unknown }).pipeline_context
          ),
        body_font_preset_id: typographyPresetId,
        body_font_preset_label: typographyPreset.label,
        body_font_size:
          bookSpecs?.font_size ??
          getReinoEditorialDefaultFontSize(
            bookSpecs?.trim_size_id ?? project.book_size ?? null
          ),
        body_line_spacing:
          bookSpecs?.line_spacing ??
          getReinoEditorialDefaultLineSpacing(),
        page_estimate:
          bookSpecs?.estimated_pages ?? project.page_estimate ?? null,
      },
      stages,
      files,
      comments,
      exports,
      jobs,
      workflowProgress: {
        current_state: resolvedWorkflowState,
        current_source: workflow ? "foundation" : "legacy_fallback",
        completed_count: technicalStages.filter((stage) => stage.status === "completed").length,
        total_count: technicalStages.length,
        technical_stages: technicalStages,
      },
      currentStageWorkspace: {
        workflow_stage_key: workflowStageKey,
        workflow_stage_definition: EDITORIAL_WORKFLOW_STAGE_MAP[workflowStageKey],
        stage_run: currentStageRun,
        findings: currentStageFindings,
        approvals: currentStageApprovals,
        latest_file: latestFile,
        gate_evaluation: gateEvaluation,
      },
    });
  } catch (error) {
    console.error("[editorial/progress] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
