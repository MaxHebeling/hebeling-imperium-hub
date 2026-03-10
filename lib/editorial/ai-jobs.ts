import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  AiJob,
  AiJobPayload,
  AiJobRun,
  AiJobRunPayload,
  AiJobStatus,
  EditorialStageKey,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * Create a new editorial AI job for a project stage.
 */
export async function createJob(payload: AiJobPayload): Promise<AiJob> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_jobs")
    .insert({
      project_id: payload.project_id,
      stage_key: payload.stage_key,
      job_type: payload.job_type,
      status: "pending",
      triggered_by: payload.triggered_by ?? null,
      metadata: payload.metadata ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[editorial] createJob error:", error);
    throw new Error(`Failed to create editorial AI job: ${error.message}`);
  }

  return data as AiJob;
}

/**
 * Update the status of an existing editorial AI job.
 * Automatically stamps updated_at via the DB trigger.
 */
export async function updateJobStatus(
  id: string,
  status: AiJobStatus
): Promise<AiJob> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_jobs")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[editorial] updateJobStatus error:", error);
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  return data as AiJob;
}

/**
 * List all AI jobs for a given project, ordered by creation time (newest first).
 */
export async function listJobsByProject(projectId: string): Promise<AiJob[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_jobs")
    .select()
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[editorial] listJobsByProject error:", error);
    throw new Error(`Failed to list jobs by project: ${error.message}`);
  }

  return (data ?? []) as AiJob[];
}

/**
 * List AI jobs for a project filtered by editorial stage key.
 */
export async function listJobsByStage(
  projectId: string,
  stageKey: EditorialStageKey
): Promise<AiJob[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_jobs")
    .select()
    .eq("project_id", projectId)
    .eq("stage_key", stageKey)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[editorial] listJobsByStage error:", error);
    throw new Error(`Failed to list jobs by stage: ${error.message}`);
  }

  return (data ?? []) as AiJob[];
}

// ─── Job Runs ─────────────────────────────────────────────────────────────────

/**
 * Open a new run record for an AI job.
 * Call this immediately before dispatching the AI task.
 */
export async function createJobRun(
  payload: AiJobRunPayload
): Promise<AiJobRun> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_job_runs")
    .insert({
      job_id: payload.job_id,
      status: "started",
    })
    .select()
    .single();

  if (error) {
    console.error("[editorial] createJobRun error:", error);
    throw new Error(`Failed to create job run: ${error.message}`);
  }

  return data as AiJobRun;
}

/**
 * Mark a run as successful, recording the output and duration.
 */
export async function markRunSuccess(
  runId: string,
  output?: Record<string, unknown>
): Promise<AiJobRun> {
  const supabase = getAdminClient();

  const finishedAt = new Date().toISOString();

  // Fetch started_at to compute duration
  const { data: existing, error: fetchError } = await supabase
    .from("editorial_ai_job_runs")
    .select("started_at")
    .eq("id", runId)
    .single();

  if (fetchError) {
    console.error("[editorial] markRunSuccess fetch error:", fetchError);
    throw new Error(`Failed to fetch run for success update: ${fetchError.message}`);
  }

  const durationMs = existing?.started_at
    ? Math.round(Date.now() - new Date(existing.started_at).getTime())
    : null;

  const { data, error } = await supabase
    .from("editorial_ai_job_runs")
    .update({
      status: "success",
      finished_at: finishedAt,
      output: output ?? null,
      duration_ms: durationMs,
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    console.error("[editorial] markRunSuccess error:", error);
    throw new Error(`Failed to mark run as success: ${error.message}`);
  }

  return data as AiJobRun;
}

/**
 * Mark a run as failed, recording the error message and duration.
 */
export async function markRunFailure(
  runId: string,
  errorMessage: string
): Promise<AiJobRun> {
  const supabase = getAdminClient();

  const finishedAt = new Date().toISOString();

  // Fetch started_at to compute duration
  const { data: existing, error: fetchError } = await supabase
    .from("editorial_ai_job_runs")
    .select("started_at")
    .eq("id", runId)
    .single();

  if (fetchError) {
    console.error("[editorial] markRunFailure fetch error:", fetchError);
    throw new Error(`Failed to fetch run for failure update: ${fetchError.message}`);
  }

  const durationMs = existing?.started_at
    ? Math.round(Date.now() - new Date(existing.started_at).getTime())
    : null;

  const { data, error } = await supabase
    .from("editorial_ai_job_runs")
    .update({
      status: "failure",
      finished_at: finishedAt,
      error_message: errorMessage,
      duration_ms: durationMs,
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    console.error("[editorial] markRunFailure error:", error);
    throw new Error(`Failed to mark run as failure: ${error.message}`);
  }

  return data as AiJobRun;
}
