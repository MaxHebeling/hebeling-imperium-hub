// ============================================================
// Editorial Checklist Service
// Manages checklist instantiation, item toggling, and status
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  EditorialStage,
  EditorialBookStageChecklist,
  EditorialChecklistItem,
} from "@/types/editorial";

/**
 * Get or create a stage checklist for a book.
 * If a template exists for the stage, it will be used to pre-populate items.
 */
export async function getOrCreateChecklist(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  orgId: string
): Promise<EditorialBookStageChecklist | null> {
  // Check if checklist already exists
  const { data: existing } = await supabase
    .from("editorial_book_stage_checklists")
    .select(
      `
      *,
      items:editorial_book_stage_checklist_items(*)
    `
    )
    .eq("book_id", bookId)
    .eq("stage", stage)
    .maybeSingle();

  if (existing) {
    return existing as EditorialBookStageChecklist;
  }

  // Find active template for this stage and org
  const { data: template } = await supabase
    .from("editorial_stage_checklist_templates")
    .select("id, editorial_stage_checklist_template_items(*)")
    .eq("org_id", orgId)
    .eq("stage", stage)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Create the checklist
  const { data: newChecklist, error } = await supabase
    .from("editorial_book_stage_checklists")
    .insert({
      book_id: bookId,
      stage,
      template_id: template?.id ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !newChecklist) {
    return null;
  }

  // Seed items from template if available
  if (template?.editorial_stage_checklist_template_items?.length) {
    const itemsToInsert = template.editorial_stage_checklist_template_items.map(
      (item: { id: string; label: string; is_required: boolean; position: number }) => ({
        checklist_id: newChecklist.id,
        template_item_id: item.id,
        label: item.label,
        is_required: item.is_required,
        position: item.position,
        is_checked: false,
      })
    );

    await supabase
      .from("editorial_book_stage_checklist_items")
      .insert(itemsToInsert);
  }

  // Return full checklist with items
  const { data: fullChecklist } = await supabase
    .from("editorial_book_stage_checklists")
    .select(
      `
      *,
      items:editorial_book_stage_checklist_items(*)
    `
    )
    .eq("id", newChecklist.id)
    .single();

  return fullChecklist as EditorialBookStageChecklist;
}

/**
 * Toggle a checklist item checked state.
 * Records who checked it and when.
 */
export async function toggleChecklistItem(
  supabase: SupabaseClient,
  itemId: string,
  isChecked: boolean,
  performedBy: string
): Promise<EditorialChecklistItem | null> {
  const { data, error } = await supabase
    .from("editorial_book_stage_checklist_items")
    .update({
      is_checked: isChecked,
      checked_by: isChecked ? performedBy : null,
      checked_at: isChecked ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data as EditorialChecklistItem;
}

/**
 * Mark a stage checklist as started (sets started_at and status = in_progress).
 */
export async function startStageChecklist(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage
): Promise<void> {
  await supabase
    .from("editorial_book_stage_checklists")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("book_id", bookId)
    .eq("stage", stage)
    .in("status", ["pending", "reopened"]);
}

/**
 * Mark a stage checklist as completed.
 */
export async function completeStageChecklist(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage
): Promise<void> {
  await supabase
    .from("editorial_book_stage_checklists")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("book_id", bookId)
    .eq("stage", stage);
}

/**
 * Reopen a stage checklist. Requires a reason (enforced at the API/service level).
 */
export async function reopenStageChecklist(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage
): Promise<void> {
  await supabase
    .from("editorial_book_stage_checklists")
    .update({
      status: "reopened",
      completed_at: null,
    })
    .eq("book_id", bookId)
    .eq("stage", stage);
}

/**
 * Assign a user as responsible for a stage checklist.
 */
export async function assignStageResponsible(
  supabase: SupabaseClient,
  bookId: string,
  stage: EditorialStage,
  assigneeId: string
): Promise<void> {
  await supabase
    .from("editorial_book_stage_checklists")
    .update({ assignee_id: assigneeId })
    .eq("book_id", bookId)
    .eq("stage", stage);
}

/**
 * Fetch all checklists for a book with their items.
 */
export async function getBookChecklists(
  supabase: SupabaseClient,
  bookId: string
): Promise<EditorialBookStageChecklist[]> {
  const { data } = await supabase
    .from("editorial_book_stage_checklists")
    .select(
      `
      *,
      items:editorial_book_stage_checklist_items(*)
    `
    )
    .eq("book_id", bookId)
    .order("stage");

  return (data ?? []) as EditorialBookStageChecklist[];
}
