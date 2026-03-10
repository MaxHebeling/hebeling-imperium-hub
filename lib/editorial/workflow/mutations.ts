import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialProjectStageChecklist,
  EditorialProjectStageChecklistItem,
  EditorialStageChecklistTemplate,
  EditorialStageChecklistTemplateItem,
  EditorialStageKey,
} from "@/lib/editorial/types/editorial";
import {
  getChecklistTemplateForStage,
  getChecklistTemplateItems,
  getProjectStageChecklist,
  getProjectStageChecklistItems,
} from "./queries";

export async function materializeProjectStageChecklist(options: {
  orgId: string;
  projectId: string;
  stageKey: EditorialStageKey;
}): Promise<{
  checklist: EditorialProjectStageChecklist | null;
  items: EditorialProjectStageChecklistItem[];
  template: EditorialStageChecklistTemplate | null;
}> {
  const existing = await getProjectStageChecklist(options.projectId, options.stageKey);
  if (existing) {
    const items = await getProjectStageChecklistItems(existing.id);
    const template = existing.template_id
      ? await getChecklistTemplateForStage(options.orgId, options.stageKey)
      : null;
    return { checklist: existing, items, template };
  }

  const template = await getChecklistTemplateForStage(options.orgId, options.stageKey);
  if (!template) {
    return { checklist: null, items: [], template: null };
  }

  const templateItems = await getChecklistTemplateItems(template.id);
  const supabase = getAdminClient();

  const { data: checklistRow, error: checklistError } = await supabase
    .from("editorial_project_stage_checklists")
    .insert({
      project_id: options.projectId,
      stage_key: options.stageKey,
      template_id: template.id,
      status: "open",
      progress_percent: 0,
    })
    .select("*")
    .single();

  if (checklistError || !checklistRow) {
    throw new Error(`Failed to create project stage checklist: ${checklistError?.message}`);
  }

  if (templateItems.length === 0) {
    return {
      checklist: checklistRow as EditorialProjectStageChecklist,
      items: [],
      template,
    };
  }

  const toInsert = templateItems.map((item: EditorialStageChecklistTemplateItem) => ({
    checklist_id: checklistRow.id,
    template_item_id: item.id,
    item_key: item.item_key,
    label: item.label,
    sort_order: item.sort_order,
    is_required: item.is_required,
    requires_file: item.requires_file,
    required_file_types: item.required_file_types,
  }));

  const { data: itemRows, error: itemsError } = await supabase
    .from("editorial_project_stage_checklist_items")
    .insert(toInsert)
    .select("*");

  if (itemsError || !itemRows) {
    throw new Error(`Failed to create project stage checklist items: ${itemsError?.message}`);
  }

  return {
    checklist: checklistRow as EditorialProjectStageChecklist,
    items: itemRows as EditorialProjectStageChecklistItem[],
    template,
  };
}

export async function setChecklistItemCompleted(options: {
  itemId: string;
  completed: boolean;
  actorId: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    is_completed: options.completed,
  };

  if (options.completed) {
    patch.completed_at = now;
    patch.completed_by = options.actorId;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }

  const { error } = await supabase
    .from("editorial_project_stage_checklist_items")
    .update(patch)
    .eq("id", options.itemId);

  if (error) {
    throw new Error(`Failed to update checklist item: ${error.message}`);
  }
}

export async function recomputeChecklistProgress(
  checklistId: string
): Promise<EditorialProjectStageChecklist> {
  const supabase = getAdminClient();
  const items = await getProjectStageChecklistItems(checklistId);
  const requiredItems = items.filter((i) => i.is_required);
  const totalRequired = requiredItems.length;
  const completedRequired = requiredItems.filter((i) => i.is_completed).length;

  const progressPercent =
    totalRequired === 0 ? 100 : Math.round((completedRequired / totalRequired) * 100);

  const now = new Date().toISOString();
  const status = progressPercent === 100 ? "completed" : "open";

  const patch: Record<string, unknown> = {
    progress_percent: progressPercent,
    status,
    updated_at: now,
  };

  if (status === "completed") {
    patch.completed_at = now;
  } else {
    patch.completed_at = null;
  }

  const { data, error } = await supabase
    .from("editorial_project_stage_checklists")
    .update(patch)
    .eq("id", checklistId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to recompute checklist progress: ${error?.message}`);
  }

  return data as EditorialProjectStageChecklist;
}

