import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiPromptTemplate, EditorialAiTaskKey } from "@/lib/editorial/types/ai";

export async function getActivePromptTemplate(options: {
  orgId: string;
  stageKey: EditorialStageKey;
  taskKey: EditorialAiTaskKey;
}): Promise<EditorialAiPromptTemplate | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_ai_prompt_templates")
    .select("*")
    .eq("org_id", options.orgId)
    .eq("stage_key", options.stageKey)
    .eq("task_key", options.taskKey)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EditorialAiPromptTemplate;
}

export function buildPrompt(template: EditorialAiPromptTemplate, context: Record<string, unknown>): string {
  // For 4B.1 we avoid complex templating; callers can interpolate as needed later.
  // This helper exists to keep the layering clean.
  void context;
  return template.prompt_text;
}

