// ============================================================
// Editorial Alerts Service
// Detects blocked/at-risk books and manages alert lifecycle
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  EditorialStage,
  EditorialAlertType,
  EditorialAlertSeverity,
  EditorialBookAlert,
} from "@/types/editorial";

interface CreateAlertParams {
  supabase: SupabaseClient;
  bookId: string;
  orgId: string;
  alertType: EditorialAlertType;
  severity: EditorialAlertSeverity;
  stage?: EditorialStage;
  message: string;
}

/**
 * Create a new alert for a book if a similar unresolved alert doesn't already exist.
 */
export async function createAlertIfNotExists(
  params: CreateAlertParams
): Promise<EditorialBookAlert | null> {
  const { supabase, bookId, orgId, alertType, severity, stage, message } = params;

  // Check for existing unresolved alert of the same type+stage
  const { data: existing } = await supabase
    .from("editorial_book_alerts")
    .select("id")
    .eq("book_id", bookId)
    .eq("alert_type", alertType)
    .eq("stage", stage ?? null)
    .eq("is_resolved", false)
    .maybeSingle();

  if (existing) {
    return null; // Already exists, skip
  }

  const { data, error } = await supabase
    .from("editorial_book_alerts")
    .insert({
      book_id: bookId,
      org_id: orgId,
      alert_type: alertType,
      severity,
      stage: stage ?? null,
      message,
      is_resolved: false,
    })
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data as EditorialBookAlert;
}

/**
 * Resolve an alert. Records who resolved it.
 */
export async function resolveAlert(
  supabase: SupabaseClient,
  alertId: string,
  resolvedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from("editorial_book_alerts")
    .update({
      is_resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  return !error;
}

/**
 * Auto-resolve alerts of a specific type+stage when the condition is fixed.
 */
export async function autoResolveAlerts(
  supabase: SupabaseClient,
  bookId: string,
  alertType: EditorialAlertType,
  stage?: EditorialStage
): Promise<void> {
  const query = supabase
    .from("editorial_book_alerts")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("book_id", bookId)
    .eq("alert_type", alertType)
    .eq("is_resolved", false);

  if (stage) {
    query.eq("stage", stage);
  }

  await query;
}

/**
 * Fetch all active alerts for a book.
 */
export async function getBookAlerts(
  supabase: SupabaseClient,
  bookId: string,
  includeResolved = false
): Promise<EditorialBookAlert[]> {
  let query = supabase
    .from("editorial_book_alerts")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (!includeResolved) {
    query = query.eq("is_resolved", false);
  }

  const { data } = await query;
  return (data ?? []) as EditorialBookAlert[];
}

/**
 * Fetch all active (unresolved) alerts for an org — used in operations dashboard.
 */
export async function getOrgActiveAlerts(
  supabase: SupabaseClient,
  orgId: string
): Promise<EditorialBookAlert[]> {
  const { data } = await supabase
    .from("editorial_book_alerts")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_resolved", false)
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as EditorialBookAlert[];
}

/**
 * Run automated blocked-state detection for a book at its current stage.
 * Creates alerts for any conditions found.
 */
export async function detectAndCreateAlerts(
  supabase: SupabaseClient,
  bookId: string,
  orgId: string,
  stage: EditorialStage
): Promise<void> {
  // 1. Check for missing assignee
  const { data: checklist } = await supabase
    .from("editorial_book_stage_checklists")
    .select("id, assignee_id, status")
    .eq("book_id", bookId)
    .eq("stage", stage)
    .maybeSingle();

  if (!checklist || !checklist.assignee_id) {
    await createAlertIfNotExists({
      supabase,
      bookId,
      orgId,
      alertType: "no_assignee",
      severity: "warning",
      stage,
      message: `La etapa "${stage}" no tiene responsable asignado.`,
    });
  } else {
    await autoResolveAlerts(supabase, bookId, "no_assignee", stage);
  }

  // 2. Check for overdue (if due_date is set and passed)
  const { data: book } = await supabase
    .from("editorial_books")
    .select("due_date")
    .eq("id", bookId)
    .single();

  if (book?.due_date) {
    const dueDate = new Date(book.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      await createAlertIfNotExists({
        supabase,
        bookId,
        orgId,
        alertType: "stage_overdue",
        severity: "critical",
        stage,
        message: `El libro tiene fecha límite vencida (${book.due_date}).`,
      });
    }
  }

  // 3. Check for incomplete required checklist items
  if (checklist) {
    const { data: items } = await supabase
      .from("editorial_book_stage_checklist_items")
      .select("id, is_required, is_checked")
      .eq("checklist_id", checklist.id ?? "")
      .eq("is_required", true);

    const pendingRequired = (items ?? []).filter((i) => !i.is_checked);
    if (pendingRequired.length > 0 && checklist.status === "in_progress") {
      await createAlertIfNotExists({
        supabase,
        bookId,
        orgId,
        alertType: "incomplete_checklist",
        severity: "warning",
        stage,
        message: `Hay ${pendingRequired.length} ítem(s) requerido(s) pendiente(s) en la etapa "${stage}".`,
      });
    } else {
      await autoResolveAlerts(supabase, bookId, "incomplete_checklist", stage);
    }
  }
}
