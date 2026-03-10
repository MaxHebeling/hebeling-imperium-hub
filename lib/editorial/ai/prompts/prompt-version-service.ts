// =============================================================================
// Prompt Version Service
// Reino Editorial AI Engine · Phase 5B
// =============================================================================
// Resolves the single approved, current prompt version for a given template.
// Unlike the loose helper in lib/editorial/prompts.ts, this service throws
// when no approved version exists — ensuring every AI run uses a governed
// prompt rather than silently falling back to an ungoverned template text.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { EditorialAiPromptVersion } from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the approved, is_current prompt version for the given template.
 *
 * Throws `PromptVersionNotApprovedError` when no such version exists so that
 * calling code can decide whether to block execution or fall back gracefully.
 *
 * @param promptTemplateId - UUID of the editorial_ai_prompt_templates row.
 */
export async function getApprovedPromptVersion(
  promptTemplateId: string
): Promise<EditorialAiPromptVersion> {
  const db = getAdminClient();

  const { data: version, error } = await db
    .from("editorial_ai_prompt_versions")
    .select("*")
    .eq("prompt_template_id", promptTemplateId)
    .eq("status", "approved")
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[prompt-version-service] DB error while resolving approved version for template ${promptTemplateId}: ${error.message}`
    );
  }

  if (!version) {
    throw new PromptVersionNotApprovedError(promptTemplateId);
  }

  return version as EditorialAiPromptVersion;
}

/**
 * Lists all versions for a template ordered by version_number descending.
 * Useful for audit UIs and diff views.
 */
export async function listPromptVersions(
  promptTemplateId: string
): Promise<EditorialAiPromptVersion[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_prompt_versions")
    .select("*")
    .eq("prompt_template_id", promptTemplateId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(
      `[prompt-version-service] Failed to list versions for template ${promptTemplateId}: ${error.message}`
    );
  }

  return (data ?? []) as EditorialAiPromptVersion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain error
// ─────────────────────────────────────────────────────────────────────────────

/** Thrown when a template has no approved + is_current prompt version. */
export class PromptVersionNotApprovedError extends Error {
  readonly promptTemplateId: string;

  constructor(promptTemplateId: string) {
    super(
      `[prompt-version-service] No approved prompt version found for template ${promptTemplateId}. ` +
        `Submit and approve a version before running AI analysis.`
    );
    this.name = "PromptVersionNotApprovedError";
    this.promptTemplateId = promptTemplateId;
  }
}
