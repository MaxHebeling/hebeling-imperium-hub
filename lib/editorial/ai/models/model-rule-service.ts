// =============================================================================
// Model Rule Resolution Service
// Reino Editorial AI Engine · Phase 5B
// =============================================================================
// Resolves which AI model configuration to use for a given editorial stage
// and analysis type (task_type), with support for a primary rule and an
// optional fallback rule when the primary is unavailable.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialStage,
  EditorialAiModelConfig,
  EditorialAiStageModelRule,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The resolved model configuration returned to the AI runner. */
export interface ResolvedModelRule {
  /** The rule record that was selected as primary. */
  rule: EditorialAiStageModelRule;
  /** Full model config for the primary rule. */
  primaryModel: EditorialAiModelConfig;
  /**
   * Optional fallback model config (the next-priority rule for the same
   * stage + task_type that is NOT the primary rule).
   */
  fallbackModel: EditorialAiModelConfig | null;
  /** ID of the prompt template linked to this rule, if any. */
  promptTemplateId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the best-matching stage model rule for a given stage and analysis
 * type (task_type) within an organisation.
 *
 * Selection priority:
 *   1. is_default = true for the given (stage, task_type, org_id)
 *   2. Lowest priority value for the same filter set
 *
 * If a second rule exists, it is returned as `fallbackModel` so the AI runner
 * can retry with an alternative model on transient provider errors.
 *
 * Throws `ModelRuleNotFoundError` when no active rule is configured.
 *
 * @param stage        - Editorial pipeline stage key.
 * @param analysisType - Matches editorial_ai_stage_model_rules.task_type.
 * @param orgId        - Organisation UUID.
 */
export async function getStageModelRule(
  stage: EditorialStage,
  analysisType: string,
  orgId: string
): Promise<ResolvedModelRule> {
  const db = getAdminClient();

  // Fetch all rules for this (org, stage, task_type), ordered by priority asc
  const { data: rules, error } = await db
    .from("editorial_ai_stage_model_rules")
    .select(
      `
      *,
      model_config:editorial_ai_model_configs(*)
      `
    )
    .eq("org_id", orgId)
    .eq("stage", stage)
    .eq("task_type", analysisType)
    .order("priority", { ascending: true });

  if (error) {
    throw new Error(
      `[model-rule-service] DB error resolving model rule for stage=${stage}, type=${analysisType}: ${error.message}`
    );
  }

  if (!rules || rules.length === 0) {
    throw new ModelRuleNotFoundError(stage, analysisType, orgId);
  }

  // Primary: prefer is_default, otherwise take the lowest priority value
  const primaryRuleRow = rules.find((r) => r.is_default) ?? rules[0];
  const primaryModel = primaryRuleRow.model_config as EditorialAiModelConfig;

  if (!primaryModel) {
    throw new Error(
      `[model-rule-service] Rule ${primaryRuleRow.id} references a missing model config.`
    );
  }

  // Fallback: the next candidate that is not the primary
  const fallbackRuleRow = rules.find((r) => r.id !== primaryRuleRow.id) ?? null;
  const fallbackModel = fallbackRuleRow
    ? (fallbackRuleRow.model_config as EditorialAiModelConfig)
    : null;

  return {
    rule: primaryRuleRow as EditorialAiStageModelRule,
    primaryModel,
    fallbackModel: fallbackModel ?? null,
    promptTemplateId: primaryRuleRow.prompt_template_id ?? null,
  };
}

/**
 * Lists all stage model rules for an org, optionally filtered by stage.
 * Useful for admin UIs and governance dashboards.
 */
export async function listStageModelRules(
  orgId: string,
  stage?: EditorialStage
): Promise<EditorialAiStageModelRule[]> {
  const db = getAdminClient();

  let query = db
    .from("editorial_ai_stage_model_rules")
    .select("*")
    .eq("org_id", orgId)
    .order("stage")
    .order("priority", { ascending: true });

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `[model-rule-service] Failed to list stage model rules: ${error.message}`
    );
  }

  return (data ?? []) as EditorialAiStageModelRule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain error
// ─────────────────────────────────────────────────────────────────────────────

/** Thrown when no stage model rule is configured for the requested context. */
export class ModelRuleNotFoundError extends Error {
  readonly stage: EditorialStage;
  readonly analysisType: string;
  readonly orgId: string;

  constructor(stage: EditorialStage, analysisType: string, orgId: string) {
    super(
      `[model-rule-service] No model rule found for stage="${stage}", ` +
        `analysisType="${analysisType}", org="${orgId}". ` +
        `Configure a rule in editorial_ai_stage_model_rules before running analysis.`
    );
    this.name = "ModelRuleNotFoundError";
    this.stage = stage;
    this.analysisType = analysisType;
    this.orgId = orgId;
  }
}
