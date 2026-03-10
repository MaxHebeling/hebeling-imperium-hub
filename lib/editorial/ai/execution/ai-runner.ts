// =============================================================================
// AI Runner — Editorial Analysis Orchestrator
// Reino Editorial AI Engine · Phase 5B
// =============================================================================
// runEditorialAiAnalysis() is the single entry-point for executing an AI
// analysis pass within the editorial pipeline.
//
// Execution flow:
//   1. Resolve the approved prompt version for the requested template
//   2. Resolve the stage model rule (primary + optional fallback model)
//   3. Create the job_run record (status: pending)
//   4. Transition job_run to 'running' and emit run_started audit event
//   5. Call the AI provider (placeholder — replace with real SDK call)
//   6. Record token usage, cost, and response references
//   7. Transition job_run to 'completed' and emit run_completed audit event
//   8. Return a structured result for downstream use (findings creation, etc.)
//
// On any failure the job_run is transitioned to 'failed' and a run_failed
// audit event is emitted before re-throwing so callers can handle the error.
// =============================================================================

import {
  getApprovedPromptVersion,
  PromptVersionNotApprovedError,
} from "@/lib/editorial/ai/prompts/prompt-version-service";
import {
  getStageModelRule,
  ModelRuleNotFoundError,
} from "@/lib/editorial/ai/models/model-rule-service";
import {
  createAiJobRun,
  startAiJobRun,
  completeAiJobRun,
  failAiJobRun,
} from "@/lib/editorial/ai/execution/job-run-service";
import {
  auditRunStarted,
  auditRunCompleted,
  auditRunFailed,
} from "@/lib/editorial/ai/audit/audit-service";
import type { EditorialAiPromptVersion, EditorialAiModelConfig, EditorialStage } from "@/types/editorial";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RunAnalysisInput {
  /** Organisation UUID (used for model rule lookup and audit events). */
  org_id: string;
  /** Editorial project UUID. */
  project_id: string;
  /** Pipeline stage key for this analysis, e.g. "estilo". */
  stage_key: EditorialStage;
  /**
   * Analysis / task type — must match editorial_ai_stage_model_rules.task_type,
   * e.g. "grammar_check", "structure_review", "style_consistency".
   */
  analysis_type: string;
  /**
   * UUID of the editorial_ai_prompt_templates row whose approved version
   * will be used to build the prompt.
   */
  prompt_template_id: string;
  /**
   * Optional editorial_jobs UUID — links this AI run to the parent job.
   */
  editorial_job_id?: string;
  /** Profile UUID of the user or service account initiating the run. */
  initiated_by?: string;
  /**
   * Context data merged into the prompt at runtime (e.g. manuscript excerpt,
   * chapter reference). Must be JSON-serialisable.
   */
  context?: Record<string, unknown>;
}

/** Raw response stub from the AI provider. Replace with provider-specific type. */
export interface AiProviderResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
  /** Opaque reference ID returned by the provider (request tracing). */
  request_id?: string;
}

/** Structured result returned to callers after a successful analysis run. */
export interface RunAnalysisResult {
  run_id: string;
  prompt_version_id: string;
  model_id: string;
  provider: string;
  raw_content: string;
  token_usage_input: number;
  token_usage_output: number;
  estimated_cost: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a complete editorial AI analysis pass for a given project stage.
 *
 * @throws PromptVersionNotApprovedError  when the template has no approved version.
 * @throws ModelRuleNotFoundError         when no model rule is configured for the stage.
 * @throws Error                          on provider or DB errors (after recording failure).
 */
export async function runEditorialAiAnalysis(
  input: RunAnalysisInput
): Promise<RunAnalysisResult> {
  // ── Step 1: Resolve the approved prompt version ──────────────────────────
  let promptVersion: EditorialAiPromptVersion;
  try {
    promptVersion = await getApprovedPromptVersion(input.prompt_template_id);
  } catch (err) {
    if (err instanceof PromptVersionNotApprovedError) throw err;
    throw new Error(
      `[ai-runner] Failed to resolve prompt version for template ${input.prompt_template_id}: ${String(err)}`
    );
  }

  // ── Step 2: Resolve the stage model rule ─────────────────────────────────
  let primaryModel: EditorialAiModelConfig;
  try {
    const resolved = await getStageModelRule(
      input.stage_key,
      input.analysis_type,
      input.org_id
    );
    primaryModel = resolved.primaryModel;
  } catch (err) {
    if (err instanceof ModelRuleNotFoundError) throw err;
    throw new Error(
      `[ai-runner] Failed to resolve model rule for stage=${input.stage_key}, ` +
        `type=${input.analysis_type}: ${String(err)}`
    );
  }

  // ── Step 3: Create the job run record ────────────────────────────────────
  const { run_id } = await createAiJobRun({
    editorial_job_id: input.editorial_job_id,
    project_id: input.project_id,
    stage_key: input.stage_key,
    analysis_type: input.analysis_type,
    prompt_version_id: promptVersion.id,
    prompt_template_id: input.prompt_template_id,
    model_config_id: primaryModel.id,
    initiated_by: input.initiated_by,
  });

  // ── Step 4: Start the run ─────────────────────────────────────────────────
  await startAiJobRun(run_id);
  await auditRunStarted(input.org_id, run_id, {
    project_id: input.project_id,
    stage_key: input.stage_key,
    model_id: primaryModel.model_id,
  });

  // ── Steps 5–7: Execute the AI call and record results ────────────────────
  try {
    const providerResponse = await callAiProvider({
      model: primaryModel,
      promptText: promptVersion.prompt_text,
      context: input.context ?? {},
    });

    const estimatedCost = computeCost(
      primaryModel,
      providerResponse.usage.prompt_tokens,
      providerResponse.usage.completion_tokens
    );

    await completeAiJobRun(run_id, {
      token_usage_input: providerResponse.usage.prompt_tokens,
      token_usage_output: providerResponse.usage.completion_tokens,
      estimated_cost: estimatedCost,
      raw_request_ref: providerResponse.request_id,
    });

    // ── Step 8: Audit the completion ─────────────────────────────────────
    await auditRunCompleted(input.org_id, run_id, {
      project_id: input.project_id,
      stage_key: input.stage_key,
      token_usage_input: providerResponse.usage.prompt_tokens,
      token_usage_output: providerResponse.usage.completion_tokens,
      estimated_cost: estimatedCost,
    });

    return {
      run_id,
      prompt_version_id: promptVersion.id,
      model_id: primaryModel.model_id,
      provider: primaryModel.provider,
      raw_content: providerResponse.content,
      token_usage_input: providerResponse.usage.prompt_tokens,
      token_usage_output: providerResponse.usage.completion_tokens,
      estimated_cost: estimatedCost,
    };
  } catch (err) {
    // Record the failure before re-throwing
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorType = classifyError(err);

    await failAiJobRun(run_id, { error_type: errorType, error_message: errorMessage });
    await auditRunFailed(input.org_id, run_id, {
      project_id: input.project_id,
      stage_key: input.stage_key,
      error_type: errorType,
      error_message: errorMessage,
    });

    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderCallInput {
  model: EditorialAiModelConfig;
  promptText: string;
  context: Record<string, unknown>;
}

/**
 * Placeholder AI provider call.
 *
 * Replace this function body with the real SDK call for the target provider:
 *   - OpenAI:     openai.chat.completions.create(...)
 *   - Anthropic:  anthropic.messages.create(...)
 *   - Google AI:  genai.generateContent(...)
 *
 * The interface contract (input/output types) must not change so that the
 * orchestrator stays provider-agnostic.
 */
async function callAiProvider(input: ProviderCallInput): Promise<AiProviderResponse> {
  // ── PLACEHOLDER — integrate real provider SDK here ──────────────────────
  //
  // Example (OpenAI):
  //
  //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  //   const completion = await openai.chat.completions.create({
  //     model: input.model.model_id,
  //     temperature: input.model.default_temperature ?? 0.3,
  //     max_tokens: input.model.default_max_tokens ?? 2000,
  //     messages: [
  //       { role: "system", content: input.promptText },
  //       { role: "user",   content: JSON.stringify(input.context) },
  //     ],
  //   });
  //   return {
  //     content:    completion.choices[0].message.content ?? "",
  //     usage:      { prompt_tokens: completion.usage?.prompt_tokens ?? 0,
  //                   completion_tokens: completion.usage?.completion_tokens ?? 0 },
  //     model:      completion.model,
  //     request_id: completion.id,
  //   };
  //
  // ────────────────────────────────────────────────────────────────────────

  return {
    content: `[PLACEHOLDER] Analysis for model=${input.model.model_id}`,
    usage: { prompt_tokens: 0, completion_tokens: 0 },
    model: input.model.model_id,
    request_id: undefined,
  };
}

/** Computes the estimated USD cost for a single model invocation. */
function computeCost(
  model: EditorialAiModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000) * model.cost_per_1k_input_tokens;
  const outputCost = (outputTokens / 1000) * model.cost_per_1k_output_tokens;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 d.p.
}

/** Returns a short machine-readable error category for audit purposes. */
function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return "unknown_error";
  const msg = err.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "provider_timeout";
  if (msg.includes("rate limit") || msg.includes("429")) return "rate_limit_exceeded";
  if (msg.includes("auth") || msg.includes("api key") || msg.includes("401"))
    return "authentication_error";
  if (msg.includes("context") || msg.includes("token") || msg.includes("length"))
    return "context_length_exceeded";
  if (msg.includes("db error") || msg.includes("supabase")) return "db_error";
  return "provider_error";
}
