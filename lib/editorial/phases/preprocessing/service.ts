import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialPreprocessingResult, NormalizedManuscriptDocument } from "./types";
import { extractRawManuscriptText } from "./extract";
import { buildNormalizedManuscriptDocument } from "./normalize";
import { assertPreprocessingState, parseEditorialPreprocessingInput } from "./validation";

type WorkflowRow = {
  id: string;
  current_state: string;
  metrics: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  language: string | null;
  current_status: string | null;
  current_manuscript_asset_id: string | null;
};

type ManuscriptAssetRow = {
  id: string;
  project_id: string;
  source_type: "upload" | "import" | "external";
  source_uri: string | null;
  original_file_name: string;
  mime_type: string;
  checksum: string | null;
  size_bytes: number | null;
  version: number;
};

async function getProjectAndWorkflow(projectId: string): Promise<{
  project: ProjectRow;
  workflow: WorkflowRow;
}> {
  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id, language, current_status, current_manuscript_asset_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to load editorial project: ${projectError?.message}`);
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state, metrics, context")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(`Failed to load editorial workflow: ${workflowError?.message}`);
  }

  return {
    project: project as ProjectRow,
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentSourceAsset(projectId: string): Promise<ManuscriptAssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select(
      "id, project_id, source_type, source_uri, original_file_name, mime_type, checksum, size_bytes, version"
    )
    .eq("project_id", projectId)
    .eq("asset_kind", "manuscript")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to load manuscript asset: ${error?.message}`);
  }

  if (!data.source_uri) {
    throw new Error("The manuscript asset does not have a source URI.");
  }

  return data as ManuscriptAssetRow;
}

async function getNextNormalizedVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "normalized_text")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read normalized asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadNormalizedDocument(
  projectId: string,
  version: number,
  document: NormalizedManuscriptDocument
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/normalized/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(document, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload normalized manuscript: ${error.message}`);
  }

  return storagePath;
}

async function persistNormalizedState(input: {
  projectId: string;
  workflowId: string;
  sourceAsset: ManuscriptAssetRow;
  normalizedDocument: NormalizedManuscriptDocument;
  normalizedStoragePath: string;
  currentState: "received" | "normalized";
}): Promise<{
  normalizedAssetId: string;
  transitioned: boolean;
}> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const normalizedAssetId = createFoundationId();
  const nextVersion = input.normalizedDocument.stats.chapter_count >= 0
    ? Number(input.normalizedStoragePath.match(/v(\d+)\.json$/)?.[1] ?? "1")
    : 1;

  const transitioned = input.currentState === "received";
  if (transitioned) {
    validateEditorialWorkflowTransition("received", "normalized");
  }

  const workflowMetrics = {
    normalized_at: now,
    detected_language: input.normalizedDocument.detected_language.code,
    word_count: input.normalizedDocument.stats.word_count,
    chapter_count: input.normalizedDocument.stats.chapter_count,
    heading_count: input.normalizedDocument.stats.heading_count,
  };

  const workflowContext = {
    normalized_asset_id: normalizedAssetId,
    source_asset_id: input.sourceAsset.id,
  };

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "normalized_text")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current normalized asset: ${clearCurrentError.message}`);
  }

  const { error: normalizedAssetError } = await supabase.from("manuscript_assets").insert({
    id: normalizedAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "normalized_text",
    source_type: input.sourceAsset.source_type,
    source_label: `Normalized ${input.sourceAsset.original_file_name}`,
    source_uri: input.normalizedStoragePath,
    original_file_name: `normalized-v${nextVersion}.json`,
    mime_type: "application/json",
    checksum: input.sourceAsset.checksum,
    size_bytes: Buffer.byteLength(
      JSON.stringify(input.normalizedDocument),
      "utf8"
    ),
    extracted_text_uri: input.normalizedStoragePath,
    version: nextVersion,
    is_current: true,
    details: {
      schema_version: 1,
      stats: input.normalizedDocument.stats,
      detected_language: input.normalizedDocument.detected_language,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (normalizedAssetError) {
    throw new Error(`Failed to persist normalized asset: ${normalizedAssetError.message}`);
  }

  const { error: sourceAssetError } = await supabase
    .from("manuscript_assets")
    .update({
      extracted_text_uri: input.normalizedStoragePath,
      updated_at: now,
    })
    .eq("id", input.sourceAsset.id);

  if (sourceAssetError) {
    throw new Error(`Failed to update source manuscript asset: ${sourceAssetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "normalized",
      context: workflowContext,
      metrics: workflowMetrics,
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to update editorial workflow: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("normalized"),
      current_status: "normalized",
      current_manuscript_asset_id: normalizedAssetId,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          preprocessing_completed: true,
          normalized_asset_id: normalizedAssetId,
          source_asset_id: input.sourceAsset.id,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "normalized",
      event_type: "preprocessing.extraction_completed",
      level: "info",
      message: "Raw manuscript text extracted successfully.",
      payload: {
        sourceAssetId: input.sourceAsset.id,
        mimeType: input.sourceAsset.mime_type,
        sizeBytes: input.sourceAsset.size_bytes,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "normalized",
      event_type: "preprocessing.structure_detected",
      level: "info",
      message: "Normalized manuscript structure created.",
      payload: {
        headingCount: input.normalizedDocument.stats.heading_count,
        chapterCount: input.normalizedDocument.stats.chapter_count,
        paragraphCount: input.normalizedDocument.stats.paragraph_count,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "normalized",
      event_type: "preprocessing.language_detected",
      level: "info",
      message: "Language detection completed for normalized manuscript.",
      payload: input.normalizedDocument.detected_language,
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "normalized",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.reprocessed",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from received to normalized."
        : "Workflow normalization was recomputed.",
      payload: {
        fromState: input.currentState,
        toState: "normalized",
        normalizedAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist preprocessing logs: ${logsError.message}`);
  }

  return {
    normalizedAssetId,
    transitioned,
  };
}

export async function executeEditorialPreprocessing(
  input: unknown
): Promise<EditorialPreprocessingResult> {
  const parsed = parseEditorialPreprocessingInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertPreprocessingState(
    workflow.current_state ?? project.current_status
  );
  const sourceAsset = await getCurrentSourceAsset(parsed.projectId);
  const rawText = await extractRawManuscriptText({
    fileName: sourceAsset.original_file_name,
    mimeType: sourceAsset.mime_type,
    storagePath: sourceAsset.source_uri!,
  });

  const normalizedDocument = buildNormalizedManuscriptDocument({
    projectId: parsed.projectId,
    sourceAssetId: sourceAsset.id,
    sourceFileName: sourceAsset.original_file_name,
    mimeType: sourceAsset.mime_type,
    declaredLanguage: project.language ?? "es",
    rawText,
  });

  const normalizedVersion = await getNextNormalizedVersion(parsed.projectId);
  const normalizedStoragePath = await uploadNormalizedDocument(
    parsed.projectId,
    normalizedVersion,
    normalizedDocument
  );

  const { normalizedAssetId, transitioned } = await persistNormalizedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    sourceAsset,
    normalizedDocument,
    normalizedStoragePath,
    currentState,
  });

  return {
    state: "normalized",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    sourceAssetId: sourceAsset.id,
    normalizedAssetId,
    extractedTextUri: normalizedStoragePath,
    normalizedAssetUri: normalizedStoragePath,
    detectedLanguage: normalizedDocument.detected_language,
    stats: normalizedDocument.stats,
    transitioned,
  };
}
