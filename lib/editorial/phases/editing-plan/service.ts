import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAnalysisReport } from "../analysis/types";
import type { NormalizedManuscriptDocument } from "../preprocessing/types";
import type { EditorialEditingPlanResult } from "./types";
import { buildEditorialEditingPlan } from "./rules";
import { assertEditingPlanState, parseEditorialEditingPlanInput } from "./validation";

type WorkflowRow = {
  id: string;
  current_state: string;
};

type ProjectRow = {
  id: string;
  current_status: string | null;
};

type AssetRow = {
  id: string;
  source_uri: string | null;
  version: number;
};

async function getProjectAndWorkflow(projectId: string): Promise<{
  project: ProjectRow;
  workflow: WorkflowRow;
}> {
  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id, current_status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to load editorial project: ${projectError?.message}`);
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state")
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

async function getCurrentAsset(
  projectId: string,
  assetKind: "normalized_text" | "analysis_output"
): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", assetKind)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to load ${assetKind} asset: ${error?.message}`);
  }

  if (!data.source_uri) {
    throw new Error(`The ${assetKind} asset does not have a source URI.`);
  }

  return data as AssetRow;
}

async function readWorkingJson<T>(storagePath: string): Promise<T> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download working asset: ${error?.message}`);
  }

  return JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8")) as T;
}

async function getNextPlanVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "editing_plan")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read editing plan versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadEditingPlan(
  projectId: string,
  version: number,
  plan: ReturnType<typeof buildEditorialEditingPlan>
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/editing-plan/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(plan, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload editing plan: ${error.message}`);
  }

  return storagePath;
}

async function persistEditingPlan(input: {
  projectId: string;
  workflowId: string;
  currentState: "analyzed" | "editing_planned";
  normalizedAssetId: string;
  analysisAssetId: string;
  planStoragePath: string;
  plan: ReturnType<typeof buildEditorialEditingPlan>;
  planVersion: number;
}): Promise<{ planAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const planAssetId = createFoundationId();
  const transitioned = input.currentState === "analyzed";

  if (transitioned) {
    validateEditorialWorkflowTransition("analyzed", "editing_planned");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "editing_plan")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current editing plan asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: planAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "editing_plan",
    source_type: "external",
    source_label: `Editing plan v${input.planVersion}`,
    source_uri: input.planStoragePath,
    original_file_name: `editing-plan-v${input.planVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.plan), "utf8"),
    extracted_text_uri: null,
    version: input.planVersion,
    is_current: true,
    details: {
      strategy: input.plan.strategy,
      chapter_count: input.plan.chapter_plan.length,
      rules_version: input.plan.rules_version,
      analysis_asset_id: input.analysisAssetId,
      normalized_asset_id: input.normalizedAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist editing plan asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "editing_planned",
      context: {
        editing_plan_asset_id: planAssetId,
        analysis_asset_id: input.analysisAssetId,
        normalized_asset_id: input.normalizedAssetId,
      },
      metrics: {
        strategy: input.plan.strategy,
        planned_chapters: input.plan.chapter_plan.length,
        high_priority_chapters: input.plan.chapter_plan.filter(
          (chapter) => chapter.priority === "high"
        ).length,
      },
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to update editorial workflow: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("editing_planned"),
      current_status: "editing_planned",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          editing_plan_completed: true,
          editing_plan_asset_id: planAssetId,
          strategy: input.plan.strategy,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project editing plan state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "editing_planned",
      event_type: "editing_plan.strategy_selected",
      level: "info",
      message: "Editing strategy selected deterministically from analysis report.",
      payload: {
        strategy: input.plan.strategy,
        reasoning: input.plan.strategy_reasoning,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "editing_planned",
      event_type: "editing_plan.generated",
      level: "info",
      message: "Editing plan generated successfully.",
      payload: {
        planAssetId,
        chapterCount: input.plan.chapter_plan.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "editing_planned",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.replanned",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from analyzed to editing_planned."
        : "Editing plan was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "editing_planned",
        planAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist editing plan logs: ${logsError.message}`);
  }

  return { planAssetId, transitioned };
}

export async function executeEditorialEditingPlan(
  input: unknown
): Promise<EditorialEditingPlanResult> {
  const parsed = parseEditorialEditingPlanInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertEditingPlanState(
    workflow.current_state ?? project.current_status
  ) as "analyzed" | "editing_planned";

  const normalizedAsset = await getCurrentAsset(parsed.projectId, "normalized_text");
  const analysisAsset = await getCurrentAsset(parsed.projectId, "analysis_output");
  const normalizedDocument = await readWorkingJson<NormalizedManuscriptDocument>(
    normalizedAsset.source_uri!
  );
  const analysisReport = await readWorkingJson<EditorialAnalysisReport>(
    analysisAsset.source_uri!
  );

  const plan = buildEditorialEditingPlan({
    projectId: parsed.projectId,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    report: analysisReport,
    document: normalizedDocument,
    generatedAt: createFoundationTimestamp(),
  });

  const planVersion = await getNextPlanVersion(parsed.projectId);
  const planStoragePath = await uploadEditingPlan(parsed.projectId, planVersion, plan);

  const { planAssetId, transitioned } = await persistEditingPlan({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    planStoragePath,
    plan,
    planVersion,
  });

  return {
    state: "editing_planned",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    planAssetId,
    planAssetUri: planStoragePath,
    strategy: plan.strategy,
    chapterCount: plan.chapter_plan.length,
    transitioned,
  };
}
