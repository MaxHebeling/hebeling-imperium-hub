import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialLayoutPackage } from "../layout-engine/types";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import {
  runLayoutQualityChecks,
  runProfessionalEditorialChecks,
} from "./rules";
import type {
  EditorialApprovedPackage,
  EditorialQualityAssuranceResult,
} from "./types";
import {
  assertQualityAssuranceState,
  parseEditorialQualityAssuranceInput,
} from "./validation";

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
  assetKind: "layout_asset"
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

async function getAssetById(assetId: string): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("id", assetId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load manuscript asset ${assetId}: ${error?.message}`);
  }

  if (!data.source_uri) {
    throw new Error(`The asset ${assetId} does not have a source URI.`);
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

async function downloadExportFile(storagePath: string): Promise<Buffer> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.exports)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download export file ${storagePath}: ${error?.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function getNextQaVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "qa_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read QA asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadQaPackage(
  projectId: string,
  version: number,
  qaPackage: EditorialApprovedPackage
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/qa-package/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(qaPackage, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload QA package: ${error.message}`);
  }

  return storagePath;
}

async function persistQaState(input: {
  projectId: string;
  workflowId: string;
  currentState: "layout_ready" | "qa_passed";
  layoutAssetId: string;
  qaPackage: EditorialApprovedPackage;
  qaPackageStoragePath: string;
  qaVersion: number;
  approved: boolean;
  criticalIssueCount: number;
  warningIssueCount: number;
}): Promise<{ qaAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const qaAssetId = createFoundationId();
  const transitioned = input.currentState === "layout_ready" && input.approved;

  if (transitioned) {
    validateEditorialWorkflowTransition("layout_ready", "qa_passed");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "qa_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current QA asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: qaAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "qa_asset",
    source_type: "external",
    source_label: `QA package v${input.qaVersion}`,
    source_uri: input.qaPackageStoragePath,
    original_file_name: `qa-package-v${input.qaVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.qaPackage), "utf8"),
    extracted_text_uri: null,
    version: input.qaVersion,
    is_current: true,
    details: {
      approved: input.approved,
      critical_issue_count: input.criticalIssueCount,
      warning_issue_count: input.warningIssueCount,
      layout_asset_id: input.layoutAssetId,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist QA asset: ${assetError.message}`);
  }

  const workflowState =
    input.approved || input.currentState === "qa_passed"
      ? "qa_passed"
      : "layout_ready";
  const projectState = workflowState;

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: workflowState,
      context: {
        qa_asset_id: qaAssetId,
        layout_asset_id: input.layoutAssetId,
        qa_approved: input.approved,
      },
      metrics: {
        critical_issue_count: input.criticalIssueCount,
        warning_issue_count: input.warningIssueCount,
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
      current_stage: mapWorkflowStateToLegacyStage(workflowState),
      current_status: projectState,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          qa_passed: input.approved,
          qa_asset_id: qaAssetId,
          critical_issue_count: input.criticalIssueCount,
          warning_issue_count: input.warningIssueCount,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project QA state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: workflowState,
      event_type: "quality_assurance.completed",
      level: input.approved ? "info" : "warning",
      message: input.approved
        ? "Quality assurance completed with zero critical errors."
        : "Quality assurance completed with blocking critical errors.",
      payload: {
        qaAssetId,
        approved: input.approved,
        criticalIssueCount: input.criticalIssueCount,
        warningIssueCount: input.warningIssueCount,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: workflowState,
      event_type: transitioned ? "workflow.transitioned" : "workflow.qa_recorded",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from layout_ready to qa_passed."
        : "QA report stored without advancing workflow state.",
      payload: {
        fromState: input.currentState,
        toState: workflowState,
        qaAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist QA logs: ${logsError.message}`);
  }

  return { qaAssetId, transitioned };
}

export async function executeEditorialQualityAssurance(
  input: unknown
): Promise<EditorialQualityAssuranceResult> {
  const parsed = parseEditorialQualityAssuranceInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertQualityAssuranceState(
    workflow.current_state ?? project.current_status
  ) as "layout_ready" | "qa_passed";

  const layoutAsset = await getCurrentAsset(parsed.projectId, "layout_asset");
  const layoutPackage = await readWorkingJson<EditorialLayoutPackage>(
    layoutAsset.source_uri!
  );
  const validatedAsset = await getAssetById(layoutPackage.validated_asset_id);
  const validatedManuscript = await readWorkingJson<EditorialValidatedManuscript>(
    validatedAsset.source_uri!
  );

  const pdfArtifact = layoutPackage.exports.find((item) => item.format === "pdf");
  const epubArtifact = layoutPackage.exports.find((item) => item.format === "epub");

  if (!pdfArtifact || !epubArtifact) {
    throw new Error("Layout package is missing exported PDF or EPUB files.");
  }

  const [pdfBuffer, epubBuffer] = await Promise.all([
    downloadExportFile(pdfArtifact.storage_path),
    downloadExportFile(epubArtifact.storage_path),
  ]);

  const qaEvaluation = runLayoutQualityChecks({
    layoutPackage,
    pdfBuffer,
    epubBuffer,
    hasCoverAsset: Boolean(layoutPackage.cover_asset_id),
  });
  const professionalEditorialEvaluation = runProfessionalEditorialChecks({
    validatedManuscript,
  });
  const checks = [
    ...qaEvaluation.checks,
    ...professionalEditorialEvaluation.checks,
  ];
  const issues = [
    ...qaEvaluation.issues,
    ...professionalEditorialEvaluation.issues,
  ];
  const criticalIssueCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const warningIssueCount = issues.filter(
    (issue) => issue.severity === "warning"
  ).length;
  const approved = criticalIssueCount === 0;
  const summary =
    issues.length === 0
      ? qaEvaluation.summary
      : `QA profesional completado con ${criticalIssueCount} error(es) crítico(s) y ${warningIssueCount} advertencia(s).`;

  const qaPackage: EditorialApprovedPackage = {
    schema_version: 1,
    project_id: parsed.projectId,
    layout_asset_id: layoutAsset.id,
    validated_asset_id: layoutPackage.validated_asset_id,
    metadata_asset_id: layoutPackage.metadata_asset_id,
    cover_asset_id: layoutPackage.cover_asset_id,
    pdf_storage_path: pdfArtifact.storage_path,
    epub_storage_path: epubArtifact.storage_path,
    checks,
    issues,
    summary,
    approved,
    generated_at: createFoundationTimestamp(),
  };

  const qaVersion = await getNextQaVersion(parsed.projectId);
  const qaPackageStoragePath = await uploadQaPackage(
    parsed.projectId,
    qaVersion,
    qaPackage
  );

  const { qaAssetId, transitioned } = await persistQaState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    layoutAssetId: layoutAsset.id,
    qaPackage,
    qaPackageStoragePath,
    qaVersion,
    approved,
    criticalIssueCount,
    warningIssueCount,
  });

  return {
    state: approved ? "qa_passed" : "layout_ready",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    layoutAssetId: layoutAsset.id,
    qaAssetId,
    qaAssetUri: qaPackageStoragePath,
    approved,
    criticalIssueCount,
    warningIssueCount,
    transitioned,
  };
}
