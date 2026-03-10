import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiPromptTemplate,
  EditorialAiPromptVersion,
  EditorialAiStageModelRule,
  EditorialAiModelConfig,
  ResolvedStageModelRule,
  EditorialStage,
  CreatePromptVersionInput,
  ApprovePromptVersionInput,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the currently approved prompt version for a given template.
 * Falls back to the template's own prompt_text when no approved version exists.
 */
export async function getApprovedPromptVersion(
  templateId: string
): Promise<{ text: string; version: EditorialAiPromptVersion | null }> {
  const db = getAdminClient();

  const { data: version, error } = await db
    .from("editorial_ai_prompt_versions")
    .select("*")
    .eq("prompt_template_id", templateId)
    .eq("status", "approved")
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    console.error("[editorial/prompts] getApprovedPromptVersion error:", error);
  }

  if (version) {
    return { text: version.prompt_text, version: version as EditorialAiPromptVersion };
  }

  // Fallback: use the base template text
  const { data: template } = await db
    .from("editorial_ai_prompt_templates")
    .select("prompt_text")
    .eq("id", templateId)
    .single();

  return { text: template?.prompt_text ?? "", version: null };
}

/**
 * Creates a new prompt version in 'draft' status.
 */
export async function createPromptVersion(
  input: CreatePromptVersionInput
): Promise<EditorialAiPromptVersion> {
  const db = getAdminClient();

  // Determine next version number
  const { data: latest } = await db
    .from("editorial_ai_prompt_versions")
    .select("version_number")
    .eq("prompt_template_id", input.prompt_template_id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version_number ?? 0) + 1;

  const { data, error } = await db
    .from("editorial_ai_prompt_versions")
    .insert({
      prompt_template_id: input.prompt_template_id,
      prompt_text: input.prompt_text,
      version_number: nextVersion,
      change_summary: input.change_summary ?? null,
      submitted_by: input.submitted_by ?? null,
      status: "draft",
      is_current: false,
    })
    .select()
    .single();

  if (error) throw new Error(`[editorial/prompts] createPromptVersion: ${error.message}`);
  return data as EditorialAiPromptVersion;
}

/**
 * Approves a prompt version, marks it as current and deprecates the
 * previous current version for the same template.
 */
export async function approvePromptVersion(
  input: ApprovePromptVersionInput
): Promise<EditorialAiPromptVersion> {
  const db = getAdminClient();

  // Fetch the version to approve
  const { data: version, error: fetchErr } = await db
    .from("editorial_ai_prompt_versions")
    .select("*")
    .eq("id", input.version_id)
    .single();

  if (fetchErr || !version) {
    throw new Error(`[editorial/prompts] Version not found: ${input.version_id}`);
  }

  // Deprecate the current version (if any)
  await db
    .from("editorial_ai_prompt_versions")
    .update({ is_current: false, status: "deprecated", updated_at: new Date().toISOString() })
    .eq("prompt_template_id", version.prompt_template_id)
    .eq("is_current", true);

  // Approve and promote
  const { data: approved, error: approveErr } = await db
    .from("editorial_ai_prompt_versions")
    .update({
      status: "approved",
      is_current: true,
      reviewed_by: input.reviewed_by,
      reviewed_at: new Date().toISOString(),
      review_notes: input.review_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.version_id)
    .select()
    .single();

  if (approveErr) throw new Error(`[editorial/prompts] approvePromptVersion: ${approveErr.message}`);

  // Update the template's active prompt text to match
  await db
    .from("editorial_ai_prompt_templates")
    .update({ prompt_text: version.prompt_text, updated_at: new Date().toISOString() })
    .eq("id", version.prompt_template_id);

  return approved as EditorialAiPromptVersion;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model rule resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the best-matching stage model rule for a given stage and task type.
 * Selection order: exact (stage + task_type) → default → highest priority.
 */
export async function resolveModelRule(
  orgId: string,
  stage: EditorialStage,
  taskType: string
): Promise<ResolvedStageModelRule | null> {
  const db = getAdminClient();

  const { data: rules, error } = await db
    .from("editorial_ai_stage_model_rules")
    .select(
      `
      *,
      model_config:editorial_ai_model_configs(*),
      prompt_template:editorial_ai_prompt_templates(*)
      `
    )
    .eq("org_id", orgId)
    .eq("stage", stage)
    .eq("task_type", taskType)
    .order("priority", { ascending: true });

  if (error) {
    console.error("[editorial/prompts] resolveModelRule error:", error);
    return null;
  }

  if (!rules || rules.length === 0) return null;

  // Prefer is_default rule, otherwise take the lowest priority value
  const defaultRule = rules.find((r) => r.is_default) ?? rules[0];
  return defaultRule as ResolvedStageModelRule;
}

/**
 * Lists all active model configs for an org.
 */
export async function listModelConfigs(orgId: string): Promise<EditorialAiModelConfig[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_ai_model_configs")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    console.error("[editorial/prompts] listModelConfigs error:", error);
    return [];
  }
  return (data ?? []) as EditorialAiModelConfig[];
}

/**
 * Lists all active prompt templates for an org, optionally filtered by stage.
 */
export async function listActivePromptTemplates(
  orgId: string,
  stage?: EditorialStage
): Promise<EditorialAiPromptTemplate[]> {
  const db = getAdminClient();
  let query = db
    .from("editorial_ai_prompt_templates")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true);

  if (stage) {
    query = query.or(`stage.eq.${stage},stage.is.null`);
  }

  const { data, error } = await query.order("name");
  if (error) {
    console.error("[editorial/prompts] listActivePromptTemplates error:", error);
    return [];
  }
  return (data ?? []) as EditorialAiPromptTemplate[];
}
