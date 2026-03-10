import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialStageChecklistTemplate,
  EditorialStageChecklistTemplateItem,
  EditorialProjectStageChecklist,
  EditorialProjectStageChecklistItem,
  EditorialStageKey,
  EditorialStageRuleDefinition,
} from "@/lib/editorial/types/editorial";

export async function getStageRuleDefinitions(
  orgId: string,
  stageKey: EditorialStageKey
): Promise<EditorialStageRuleDefinition[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stage_rule_definitions")
    .select("*")
    .eq("org_id", orgId)
    .eq("stage_key", stageKey)
    .eq("is_enabled", true);
  if (error || !data) return [];
  return data as EditorialStageRuleDefinition[];
}

export async function getChecklistTemplateForStage(
  orgId: string,
  stageKey: EditorialStageKey
): Promise<EditorialStageChecklistTemplate | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stage_checklist_templates")
    .select("*")
    .eq("org_id", orgId)
    .eq("stage_key", stageKey)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditorialStageChecklistTemplate;
}

export async function getChecklistTemplateItems(
  templateId: string
): Promise<EditorialStageChecklistTemplateItem[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stage_checklist_template_items")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as EditorialStageChecklistTemplateItem[];
}

export async function getProjectStageChecklist(
  projectId: string,
  stageKey: EditorialStageKey
): Promise<EditorialProjectStageChecklist | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_stage_checklists")
    .select("*")
    .eq("project_id", projectId)
    .eq("stage_key", stageKey)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditorialProjectStageChecklist;
}

export async function getProjectStageChecklistItems(
  checklistId: string
): Promise<EditorialProjectStageChecklistItem[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_stage_checklist_items")
    .select("*")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as EditorialProjectStageChecklistItem[];
}


