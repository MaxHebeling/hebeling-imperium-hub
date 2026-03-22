import { NextResponse } from "next/server";
import {
  createFoundationId,
  createFoundationTimestamp,
  EDITORIAL_WORKFLOW_SEQUENCE,
  type EditorialWorkflowState,
} from "@/lib/editorial/foundation";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { getAdminClient } from "@/lib/leads/helpers";
import { bucketKeyForFileType } from "@/lib/editorial/storage/upload";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { ensureEditorialBuckets } from "@/lib/editorial/storage/provision";
import { executeEditorialPreprocessing } from "@/lib/editorial/phases/preprocessing/service";
import { executeEditorialAnalysis } from "@/lib/editorial/phases/analysis/service";
import { executeEditorialEditingPlan } from "@/lib/editorial/phases/editing-plan/service";
import { executeEditorialContentEditing } from "@/lib/editorial/phases/content-editing/service";
import { executeEditorialProofreading } from "@/lib/editorial/phases/proofreading/service";
import { executeEditorialSemanticValidation } from "@/lib/editorial/phases/semantic-validation/service";
import { executeEditorialMetadataGeneration } from "@/lib/editorial/phases/metadata-generation/service";
import { executeEditorialLayoutEngine } from "@/lib/editorial/phases/layout-engine/service";
import { executeEditorialQualityAssurance } from "@/lib/editorial/phases/quality-assurance/service";

type WorkflowRow = {
  id: string;
  current_state: EditorialWorkflowState;
};

type ProjectRow = {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  language: string;
  genre: string | null;
  current_stage: string;
  current_status: string | null;
  metadata_id: string | null;
  current_manuscript_asset_id: string | null;
};

const LEGACY_STAGE_TO_BOOTSTRAP_STATE: Record<string, EditorialWorkflowState> = {
  recepcion: "received",
  preparacion: "analyzed",
  edicion_editorial: "editing_planned",
  correccion_linguistica: "content_edited",
  preprensa_kdp: "proofread",
  validacion_paginas: "validated",
  briefing_portada: "metadata_ready",
  generacion_portada: "metadata_ready",
  maquetacion_interior: "metadata_ready",
  marketing_editorial: "qa_passed",
  entrega_final: "qa_passed",
};

type ActiveWorkflowState = Exclude<
  EditorialWorkflowState,
  "qa_passed" | "packaged" | "published" | "marketed"
>;

type ContinuousRunTargetState = (typeof EDITORIAL_WORKFLOW_SEQUENCE)[number];

export const maxDuration = 300;
const CONTINUOUS_RUN_SOFT_LIMIT_MS = 240_000;

function isPartialPhaseResult(
  value: unknown
): value is {
  partial: true;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "partial" in value &&
    (value as { partial?: unknown }).partial === true
  );
}

async function executeValidatedToLayoutFlow(input: {
  projectId: string;
}): Promise<{
  collapsed: true;
  metadata: unknown;
  layout: unknown;
}> {
  const metadata = await executeEditorialMetadataGeneration(input);
  const layout = await executeEditorialLayoutEngine(input);

  return {
    collapsed: true,
    metadata,
    layout,
  };
}

const EXECUTORS: Record<
  ActiveWorkflowState,
  (input: { projectId: string }) => Promise<unknown>
> = {
  received: executeEditorialPreprocessing,
  normalized: executeEditorialAnalysis,
  analyzed: executeEditorialEditingPlan,
  editing_planned: executeEditorialContentEditing,
  content_edited: executeEditorialProofreading,
  proofread: executeEditorialSemanticValidation,
  validated: executeValidatedToLayoutFlow,
  metadata_ready: executeEditorialLayoutEngine,
  cover_ready: executeEditorialLayoutEngine,
  layout_ready: executeEditorialQualityAssurance,
};

function normalizeWorkflowState(
  state: EditorialWorkflowState
): ContinuousRunTargetState {
  if (state === "packaged" || state === "published" || state === "marketed") {
    return "qa_passed";
  }

  if (state === "cover_ready") {
    return "layout_ready";
  }

  return state as ContinuousRunTargetState;
}

function getWorkflowStateIndex(state: EditorialWorkflowState | null | undefined) {
  if (!state) {
    return -1;
  }

  return EDITORIAL_WORKFLOW_SEQUENCE.indexOf(normalizeWorkflowState(state));
}

function hasReachedWorkflowTarget(
  currentState: EditorialWorkflowState | null | undefined,
  targetState: ContinuousRunTargetState
) {
  const currentIndex = getWorkflowStateIndex(currentState);
  const targetIndex = getWorkflowStateIndex(targetState);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function resolveBucketName(fileType: string): string {
  const bucketKey = bucketKeyForFileType(fileType);
  return EDITORIAL_BUCKETS[bucketKey];
}

async function getProject(projectId: string): Promise<ProjectRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select(
      "id, title, subtitle, author_name, language, genre, current_stage, current_status, metadata_id, current_manuscript_asset_id"
    )
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load editorial project: ${error?.message}`);
  }

  return data as ProjectRow;
}

async function getWorkflow(projectId: string): Promise<WorkflowRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_workflows")
    .select("id, current_state")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data as WorkflowRow;
}

async function ensureLegacyBootstrap(project: ProjectRow): Promise<WorkflowRow> {
  const supabase = getAdminClient();
  const existingWorkflow = await getWorkflow(project.id);
  if (existingWorkflow) {
    return existingWorkflow;
  }

  const now = createFoundationTimestamp();
  const workflowId = createFoundationId();
  const metadataId = project.metadata_id ?? createFoundationId();
  const bootstrapState =
    LEGACY_STAGE_TO_BOOTSTRAP_STATE[project.current_stage] ?? "received";

  const { error: metadataError } = await supabase.from("editorial_metadata").upsert(
    {
      id: metadataId,
      project_id: project.id,
      author: project.author_name ?? "Autor no definido",
      title: project.title,
      subtitle: project.subtitle,
      language: project.language || "es",
      genre: project.genre ?? "general",
      synopsis: null,
      tags: [],
      extra: {
        bootstrapped_from_legacy: true,
      },
      created_at: now,
      updated_at: now,
    },
    { onConflict: "project_id" }
  );

  if (metadataError) {
    throw new Error(`Failed to bootstrap editorial metadata: ${metadataError.message}`);
  }

  let currentManuscriptAssetId = project.current_manuscript_asset_id;

  const { data: existingAsset } = await supabase
    .from("manuscript_assets")
    .select("id")
    .eq("project_id", project.id)
    .eq("asset_kind", "manuscript")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAsset?.id) {
    currentManuscriptAssetId = existingAsset.id;
  } else {
    const latestLegacyManuscript = await getLatestManuscriptForProject(project.id);
    if (!latestLegacyManuscript) {
      throw new Error("No manuscript file was found to bootstrap the editorial workflow.");
    }

    const legacyFile = latestLegacyManuscript.file;
    const manuscriptAssetId = createFoundationId();
    const bucket = resolveBucketName(legacyFile.file_type);

    const { error: assetError } = await supabase.from("manuscript_assets").insert({
      id: manuscriptAssetId,
      project_id: project.id,
      workflow_id: null,
      asset_kind: "manuscript",
      source_type: "upload",
      source_label: legacyFile.file_type,
      source_uri: legacyFile.storage_path,
      original_file_name: legacyFile.storage_path.split("/").pop() ?? legacyFile.storage_path,
      mime_type: legacyFile.mime_type ?? "application/octet-stream",
      size_bytes: legacyFile.size_bytes,
      version: 1,
      is_current: true,
      details: {
        bootstrapped_from_legacy: true,
        bucket,
        legacy_file_id: legacyFile.id,
      },
      uploaded_at: legacyFile.created_at,
      created_at: now,
      updated_at: now,
    });

    if (assetError) {
      throw new Error(`Failed to bootstrap manuscript asset: ${assetError.message}`);
    }

    currentManuscriptAssetId = manuscriptAssetId;
  }

  const { data: persistedWorkflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .upsert(
      {
        id: workflowId,
        project_id: project.id,
        current_state: bootstrapState,
        status: "active",
        context: {
          bootstrapped_from_legacy: true,
          legacy_stage: project.current_stage,
        },
        metrics: {},
        created_at: now,
        updated_at: now,
      },
      { onConflict: "project_id" }
    )
    .select("id, current_state")
    .single();

  if (workflowError || !persistedWorkflow) {
    throw new Error(`Failed to bootstrap editorial workflow: ${workflowError?.message}`);
  }

  if (currentManuscriptAssetId) {
    const { error: assetLinkError } = await supabase
      .from("manuscript_assets")
      .update({
        workflow_id: persistedWorkflow.id,
        updated_at: now,
      })
      .eq("id", currentManuscriptAssetId);

    if (assetLinkError) {
      throw new Error(`Failed to link manuscript asset to workflow: ${assetLinkError.message}`);
    }
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage(bootstrapState),
      current_status: bootstrapState,
      metadata_id: metadataId,
      current_manuscript_asset_id: currentManuscriptAssetId,
      workflow_schema_version: 2,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        project.id,
        {
          bootstrapped_from_legacy: true,
          legacy_stage: project.current_stage,
        }
      ),
      updated_at: now,
    })
    .eq("id", project.id);

  if (projectError) {
    throw new Error(`Failed to finalize legacy bootstrap: ${projectError.message}`);
  }

  await supabase.from("pipeline_logs").insert({
    id: createFoundationId(),
    project_id: project.id,
    workflow_id: persistedWorkflow.id,
    stage_id: null,
    stage_key: bootstrapState,
    event_type: "workflow.bootstrapped_from_legacy",
    level: "info",
    message: "Legacy project was initialized into the AI-native workflow.",
    payload: {
      legacy_stage: project.current_stage,
      bootstrap_state: bootstrapState,
    },
    created_at: now,
  });

  return {
    id: persistedWorkflow.id,
    current_state: persistedWorkflow.current_state,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectId?: string;
      targetState?: ContinuousRunTargetState;
    };
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;
    const targetState =
      typeof body?.targetState === "string"
        ? normalizeWorkflowState(body.targetState as EditorialWorkflowState)
        : null;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required." },
        { status: 400 }
      );
    }

    const project = await getProject(projectId);
    const workflow = await ensureLegacyBootstrap(project);
    await ensureEditorialBuckets();
    const normalizedWorkflowState = normalizeWorkflowState(workflow.current_state);
    const resolvedTargetState = targetState ?? null;

    if (
      normalizedWorkflowState === "qa_passed" ||
      (resolvedTargetState &&
        hasReachedWorkflowTarget(normalizedWorkflowState, resolvedTargetState))
    ) {
      return NextResponse.json({
        success: true,
        message:
          resolvedTargetState === "qa_passed"
            ? "El workflow ya llegó a su etapa final activa de control de calidad."
            : "El workflow ya alcanzó la etapa objetivo solicitada.",
        executedState: normalizedWorkflowState,
        nextState: null,
        completed: true,
        executedStates: [],
      });
    }

    const executedStates: EditorialWorkflowState[] = [];
    const stepLimit = Math.max(
      EDITORIAL_WORKFLOW_SEQUENCE.length + 2,
      resolvedTargetState ? EDITORIAL_WORKFLOW_SEQUENCE.length : 1
    );

    let currentState: ContinuousRunTargetState = normalizedWorkflowState;
    let result: unknown = null;
    let updatedWorkflow: WorkflowRow | null = workflow;
    let partialProgress = false;
    const runStartedAt = Date.now();

    for (let stepIndex = 0; stepIndex < stepLimit; stepIndex += 1) {
      if (resolvedTargetState && hasReachedWorkflowTarget(currentState, resolvedTargetState)) {
        break;
      }
      if (stepIndex > 0 && Date.now() - runStartedAt >= CONTINUOUS_RUN_SOFT_LIMIT_MS) {
        break;
      }

      const executor = EXECUTORS[currentState as ActiveWorkflowState];
      if (!executor) {
        throw new Error(`No executor is registered for workflow state "${currentState}".`);
      }

      executedStates.push(currentState);
      result = await executor({ projectId });
      partialProgress = isPartialPhaseResult(result);
      updatedWorkflow = await getWorkflow(projectId);

      if (!updatedWorkflow) {
        throw new Error("No se pudo recargar el workflow después de ejecutar la fase.");
      }

      const nextState = normalizeWorkflowState(updatedWorkflow.current_state);
      if (getWorkflowStateIndex(nextState) <= getWorkflowStateIndex(currentState)) {
        if (partialProgress) {
          break;
        }
        throw new Error(
          `El workflow no avanzó después de ejecutar la fase "${currentState}".`
        );
      }

      currentState = nextState;

      if (!resolvedTargetState) {
        break;
      }
    }

    const completed =
      resolvedTargetState !== null &&
      updatedWorkflow !== null &&
      hasReachedWorkflowTarget(
        normalizeWorkflowState(updatedWorkflow.current_state),
        resolvedTargetState
      );

    const message = completed
      ? resolvedTargetState === "qa_passed"
        ? "La IA procesó automáticamente todo el pipeline activo hasta Control de calidad."
        : `La IA avanzó automáticamente el workflow hasta "${resolvedTargetState}".`
      : resolvedTargetState === "qa_passed"
        ? partialProgress
          ? "La IA avanzó un lote parcial dentro de la fase actual y seguirá automáticamente en la siguiente llamada hasta Control de calidad."
          : "La IA avanzó el workflow y continuará automáticamente en la siguiente llamada hasta Control de calidad."
        : resolvedTargetState
          ? `La IA avanzó parcialmente hacia "${resolvedTargetState}" y continuará automáticamente en la siguiente llamada.`
          : "La etapa técnica actual se procesó correctamente.";

    return NextResponse.json({
      success: true,
      message,
      executedState: normalizedWorkflowState,
      nextState: updatedWorkflow ? normalizeWorkflowState(updatedWorkflow.current_state) : null,
      executedStates,
      completed,
      partial: partialProgress,
      result,
    });
  } catch (error) {
    console.error("[editorial/workflow/run-current] POST error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
