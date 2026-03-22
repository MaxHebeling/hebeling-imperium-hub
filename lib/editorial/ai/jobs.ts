import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAiJobContext, EditorialAiJobStatus, EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";

function mapJobStatusToDb(status: EditorialAiJobStatus): { status: string; setStartedAt: boolean; setFinishedAt: boolean } {
  switch (status) {
    case "queued":
      return { status: "queued", setStartedAt: false, setFinishedAt: false };
    case "running":
      return { status: "processing", setStartedAt: true, setFinishedAt: false };
    case "succeeded":
      return { status: "completed", setStartedAt: false, setFinishedAt: true };
    case "failed":
      return { status: "failed", setStartedAt: false, setFinishedAt: true };
    case "cancelled":
      return { status: "cancelled", setStartedAt: false, setFinishedAt: true };
    default:
      return { status: String(status), setStartedAt: false, setFinishedAt: false };
  }
}

export async function requestAiTask(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialPipelineStageKey;
  taskKey: EditorialAiTaskKey;
  sourceFileId?: string;
  sourceFileVersion?: number;
  requestedBy: string;
  promptTemplateId?: string | null;
  promptTemplateVersion?: number | null;
}): Promise<{ jobId: string }> {
  const supabase = getAdminClient();

  const context: EditorialAiJobContext = {
    project_id: options.projectId,
    stage_key: options.stageKey,
    source_file_id: options.sourceFileId ?? null,
    source_file_version: options.sourceFileVersion ?? null,
    requested_by: options.requestedBy,
    prompt_template_id: options.promptTemplateId ?? null,
    prompt_template_version: options.promptTemplateVersion ?? null,
  };

  const { data, error } = await supabase
    .from("editorial_jobs")
    .insert({
      project_id: options.projectId,
      stage_key: options.stageKey,
      job_type: options.taskKey,
      provider: "openai",
      status: "queued",
      input_ref: JSON.stringify(context),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create AI job: ${error?.message}`);
  }

  return { jobId: data.id as string };
}

export async function markAiJobStatus(options: {
  jobId: string;
  status: EditorialAiJobStatus;
  errorLog?: string | null;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const mapping = mapJobStatusToDb(options.status);

  const patch: Record<string, unknown> = {
    status: mapping.status,
  };

  if (mapping.setStartedAt) {
    patch.started_at = now;
  }

  if (mapping.setFinishedAt) {
    patch.finished_at = now;
  }

  if (typeof options.errorLog === "string") {
    patch.error_log = options.errorLog;
  }

  const { error } = await supabase
    .from("editorial_jobs")
    .update(patch)
    .eq("id", options.jobId);

  if (error) {
    throw new Error(`Failed to update AI job status: ${error.message}`);
  }
}
