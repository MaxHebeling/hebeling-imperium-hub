import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAlertStatus, EditorialProjectAlert } from "./types";

export async function listProjectAlerts(projectId: string): Promise<EditorialProjectAlert[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_alerts")
    .select("*")
    .eq("project_id", projectId)
    .order("last_detected_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialProjectAlert[];
}

export async function updateAlertStatus(options: {
  alertId: string;
  status: EditorialAlertStatus;
  actorId: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: options.status,
    updated_at: now,
  };
  if (options.status === "acknowledged") {
    patch.acknowledged_at = now;
    patch.acknowledged_by = options.actorId;
  }
  if (options.status === "resolved") {
    patch.resolved_at = now;
    patch.resolved_by = options.actorId;
  }
  if (options.status === "open") {
    patch.acknowledged_at = null;
    patch.acknowledged_by = null;
    patch.resolved_at = null;
    patch.resolved_by = null;
  }

  const { error } = await supabase
    .from("editorial_project_alerts")
    .update(patch)
    .eq("id", options.alertId);
  if (error) throw new Error(`Failed to update alert status: ${error.message}`);
}

export async function upsertOperationalAlert(options: {
  orgId: string;
  projectId: string;
  stageKey?: string | null;
  alertType: string;
  severity: "info" | "warning" | "critical";
  isBlocking: boolean;
  title: string;
  message: string;
  dedupeKey: string;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  // Upsert one row per (project_id, dedupe_key).
  // If it was previously resolved/acknowledged, reopening sets status=open and clears ack/resolve metadata.
  const { error } = await supabase
    .from("editorial_project_alerts")
    .upsert(
      {
        org_id: options.orgId,
        project_id: options.projectId,
        stage_key: options.stageKey ?? null,
        alert_type: options.alertType,
        status: "open",
        severity: options.severity,
        is_blocking: options.isBlocking,
        title: options.title,
        message: options.message,
        details: options.details ?? null,
        dedupe_key: options.dedupeKey,
        last_detected_at: now,
        updated_at: now,
        resolved_at: null,
        resolved_by: null,
        acknowledged_at: null,
        acknowledged_by: null,
      },
      { onConflict: "project_id,dedupe_key" }
    );
  if (error) throw new Error(`Failed to upsert alert: ${error.message}`);

  // Ensure first_detected_at is set for existing rows (best-effort).
  await supabase
    .from("editorial_project_alerts")
    .update({ first_detected_at: now })
    .eq("project_id", options.projectId)
    .eq("dedupe_key", options.dedupeKey)
    .is("first_detected_at", null);
}

export async function resolveAlertByDedupeKey(options: {
  projectId: string;
  dedupeKey: string;
  actorId?: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: "resolved",
    updated_at: now,
    resolved_at: now,
    resolved_by: options.actorId ?? null,
  };
  const { error } = await supabase
    .from("editorial_project_alerts")
    .update(patch)
    .eq("project_id", options.projectId)
    .eq("dedupe_key", options.dedupeKey);
  if (error) throw new Error(`Failed to resolve alert: ${error.message}`);
}

