// ============================================================
// Editorial Workflow Events Service
// Immutable audit trail for all editorial pipeline actions
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  EditorialEventType,
  EditorialStage,
  EditorialWorkflowEvent,
} from "@/types/editorial";

interface LogEventParams {
  supabase: SupabaseClient;
  bookId: string;
  orgId: string;
  eventType: EditorialEventType;
  performedBy: string;
  stage?: EditorialStage;
  targetUserId?: string;
  payload?: Record<string, unknown>;
  reason?: string;
  isOverride?: boolean;
  overrideReason?: string;
}

/**
 * Log an immutable workflow event. All significant editorial actions must call this.
 */
export async function logWorkflowEvent(
  params: LogEventParams
): Promise<EditorialWorkflowEvent | null> {
  const {
    supabase,
    bookId,
    orgId,
    eventType,
    performedBy,
    stage,
    targetUserId,
    payload = {},
    reason,
    isOverride = false,
    overrideReason,
  } = params;

  const { data, error } = await supabase
    .from("editorial_workflow_events")
    .insert({
      book_id: bookId,
      org_id: orgId,
      event_type: eventType,
      stage: stage ?? null,
      performed_by: performedBy,
      target_user_id: targetUserId ?? null,
      payload,
      reason: reason ?? null,
      is_override: isOverride,
      override_reason: overrideReason ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data as EditorialWorkflowEvent;
}

/**
 * Fetch the workflow event feed for a book, ordered newest first.
 */
export async function getBookEventFeed(
  supabase: SupabaseClient,
  bookId: string,
  limit = 50
): Promise<EditorialWorkflowEvent[]> {
  const { data } = await supabase
    .from("editorial_workflow_events")
    .select(
      `
      *,
      performer:profiles!editorial_workflow_events_performed_by_fkey(full_name, email)
    `
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as EditorialWorkflowEvent[];
}

/**
 * Fetch recent events across all books for an org (for the operations dashboard).
 */
export async function getOrgRecentEvents(
  supabase: SupabaseClient,
  orgId: string,
  limit = 30
): Promise<EditorialWorkflowEvent[]> {
  const { data } = await supabase
    .from("editorial_workflow_events")
    .select(
      `
      *,
      performer:profiles!editorial_workflow_events_performed_by_fkey(full_name, email)
    `
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as EditorialWorkflowEvent[];
}
