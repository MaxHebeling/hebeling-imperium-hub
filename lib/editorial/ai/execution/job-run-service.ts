// =============================================================================
// AI Job Run Service
// Reino Editorial AI Engine · Phase 5B
// =============================================================================
// Manages the full lifecycle of an editorial_ai_job_runs record:
//   queued → running → completed | failed
//
// Intentionally separate from lib/editorial/job-runs.ts (the generic Phase 5A
// helper). This service exposes domain-level field names expected by the AI
// runner (analysis_type, stage_key, token_usage_input, etc.) and maps them to
// the actual DB column schema.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { EditorialAiJobRun, EditorialStage } from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input / output types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateAiJobRunInput {
  /** UUID of the editorial_jobs row that triggered this run (optional). */
  editorial_job_id?: string;
  /** UUID of the editorial_projects row. */
  project_id: string;
  /** Pipeline stage key, e.g. "estilo". */
  stage_key: EditorialStage;
  /** Task / analysis type matching editorial_ai_stage_model_rules.task_type. */
  analysis_type: string;
  /** Approved prompt version UUID to snapshot against this run. */
  prompt_version_id?: string;
  /** Prompt template UUID (parent of the version). */
  prompt_template_id?: string;
  /** Model config UUID resolved by the model-rule-service. */
  model_config_id?: string;
  /** Profile UUID of the user or service account that initiated the run. */
  initiated_by?: string;
}

/** Metrics reported back by the AI provider after a successful call. */
export interface AiJobRunMetrics {
  token_usage_input: number;
  token_usage_output: number;
  /** Estimated cost in USD based on the model's pricing. */
  estimated_cost: number;
  /** Reference to the raw request payload (e.g. a storage path or request ID). */
  raw_request_ref?: string;
  /** Reference to the raw response payload (e.g. a storage path). */
  raw_response_ref?: string;
  /** Optional override for wall-clock duration in milliseconds. */
  duration_ms?: number;
}

/** Error context reported when an AI call fails. */
export interface AiJobRunError {
  /** Short machine-readable error category, e.g. "provider_timeout". */
  error_type: string;
  /** Human-readable description of the failure. */
  error_message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserts a new editorial_ai_job_runs row with status = 'pending' and returns
 * the run_id so that the caller can reference it throughout the lifecycle.
 *
 * The analysis_type is persisted inside `input_payload.analysis_type` because
 * the DB schema does not have a dedicated column for it.
 */
export async function createAiJobRun(
  input: CreateAiJobRunInput
): Promise<{ run_id: string; run: EditorialAiJobRun }> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .insert({
      job_id: input.editorial_job_id ?? null,
      project_id: input.project_id,
      stage: input.stage_key,
      prompt_version_id: input.prompt_version_id ?? null,
      prompt_template_id: input.prompt_template_id ?? null,
      model_config_id: input.model_config_id ?? null,
      initiated_by: input.initiated_by ?? null,
      status: "pending",
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      // Persist analysis_type inside input_payload for traceability
      input_payload: { analysis_type: input.analysis_type },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[job-run-service] createAiJobRun failed: ${error.message}`);
  }

  const run = data as EditorialAiJobRun;
  return { run_id: run.id, run };
}

/**
 * Transitions the job run to 'running'.
 * Records the start timestamp inside `output_payload.started_at` since the
 * DB schema uses a single `completed_at` for the terminal timestamp.
 */
export async function startAiJobRun(runId: string): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const startedAt = new Date().toISOString();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .update({
      status: "running",
      // Merge started_at into output_payload so it can be read without joins
      output_payload: { started_at: startedAt },
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    throw new Error(`[job-run-service] startAiJobRun(${runId}) failed: ${error.message}`);
  }

  return data as EditorialAiJobRun;
}

/**
 * Transitions the job run to 'completed' and records all execution metrics.
 *
 * `duration_ms` is computed from `output_payload.started_at` (set by
 * `startAiJobRun`) when not supplied explicitly.
 */
export async function completeAiJobRun(
  runId: string,
  metrics: AiJobRunMetrics
): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const completedAt = new Date().toISOString();

  // Resolve duration: use explicit value or read started_at from output_payload
  let durationMs = metrics.duration_ms ?? null;
  if (durationMs === null) {
    const { data: current } = await db
      .from("editorial_ai_job_runs")
      .select("output_payload")
      .eq("id", runId)
      .single();

    const startedAt =
      current?.output_payload &&
      typeof current.output_payload === "object" &&
      !Array.isArray(current.output_payload)
        ? (current.output_payload as { started_at?: string }).started_at
        : undefined;

    if (startedAt) {
      durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
    }
  }

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .update({
      status: "completed",
      input_tokens: metrics.token_usage_input,
      output_tokens: metrics.token_usage_output,
      cost_usd: metrics.estimated_cost,
      duration_ms: durationMs,
      completed_at: completedAt,
      // Merge response refs into output_payload
      output_payload: {
        raw_request_ref: metrics.raw_request_ref ?? null,
        raw_response_ref: metrics.raw_response_ref ?? null,
      },
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    throw new Error(`[job-run-service] completeAiJobRun(${runId}) failed: ${error.message}`);
  }

  return data as EditorialAiJobRun;
}

/**
 * Transitions the job run to 'failed' and records the error context.
 * The error_type is stored in `output_payload.error_type` since the DB schema
 * only has a single `error_message` column.
 */
export async function failAiJobRun(
  runId: string,
  error: AiJobRunError
): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const completedAt = new Date().toISOString();

  const { data, error: dbError } = await db
    .from("editorial_ai_job_runs")
    .update({
      status: "failed",
      error_message: error.error_message,
      completed_at: completedAt,
      output_payload: { error_type: error.error_type },
    })
    .eq("id", runId)
    .select()
    .single()
    .then((res) => ({ data: res.data, error: res.error }));

  if (dbError) {
    throw new Error(`[job-run-service] failAiJobRun(${runId}) failed: ${dbError.message}`);
  }

  return data as EditorialAiJobRun;
}

/**
 * Returns the full job run record for a given run ID.
 */
export async function getAiJobRun(runId: string): Promise<EditorialAiJobRun> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_job_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) {
    throw new Error(`[job-run-service] Job run ${runId} not found: ${error?.message ?? "no data"}`);
  }

  return data as EditorialAiJobRun;
}
