import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiJobRun,
  CreateJobRunInput,
  CompleteJobRunInput,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Creates a new AI job run record in 'pending' status and returns it.
 * Call this before invoking the AI model so you have an ID for tracing.
 */
export async function createJobRun(input: CreateJobRunInput): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .insert({
      project_id: input.project_id,
      stage: input.stage,
      job_id: input.job_id ?? null,
      prompt_template_id: input.prompt_template_id ?? null,
      prompt_version_id: input.prompt_version_id ?? null,
      model_config_id: input.model_config_id ?? null,
      input_payload: input.input_payload ?? null,
      initiated_by: input.initiated_by ?? null,
      status: "pending",
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
    })
    .select()
    .single();

  if (error) throw new Error(`[editorial/job-runs] createJobRun: ${error.message}`);
  return data as EditorialAiJobRun;
}

/**
 * Marks a job run as 'running' and returns the updated record.
 */
export async function startJobRun(runId: string): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .update({ status: "running" })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw new Error(`[editorial/job-runs] startJobRun: ${error.message}`);
  return data as EditorialAiJobRun;
}

/**
 * Finalises a job run with status, output, token counts and cost.
 */
export async function completeJobRun(input: CompleteJobRunInput): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .update({
      status: input.status,
      output_payload: input.output_payload ?? null,
      error_message: input.error_message ?? null,
      input_tokens: input.input_tokens ?? 0,
      output_tokens: input.output_tokens ?? 0,
      cost_usd: input.cost_usd ?? 0,
      duration_ms: input.duration_ms ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.run_id)
    .select()
    .single();

  if (error) throw new Error(`[editorial/job-runs] completeJobRun: ${error.message}`);
  return data as EditorialAiJobRun;
}

/**
 * Retrieves a single job run by ID.
 */
export async function getJobRun(runId: string): Promise<EditorialAiJobRun | null> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    console.error("[editorial/job-runs] getJobRun error:", error);
    return null;
  }
  return (data ?? null) as EditorialAiJobRun | null;
}

/**
 * Lists the most recent job runs for a project, newest first.
 */
export async function listJobRunsForProject(
  projectId: string,
  limit = 50
): Promise<EditorialAiJobRun[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[editorial/job-runs] listJobRunsForProject error:", error);
    return [];
  }
  return (data ?? []) as EditorialAiJobRun[];
}
