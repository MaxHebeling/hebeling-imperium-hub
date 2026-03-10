import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

export type EditorialAlertStatus = "open" | "acknowledged" | "resolved";

export type EditorialAlertType =
  | "missing_assignment"
  | "missing_required_file"
  | "checklist_incomplete"
  | "critical_rule_failed"
  | "inactivity_risk"
  | "sla_risk";

export type EditorialAlertSeverity = "info" | "warning" | "critical";

export interface EditorialProjectAlert {
  id: string;
  org_id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  alert_type: EditorialAlertType | string;
  status: EditorialAlertStatus | string;
  severity: EditorialAlertSeverity | string;
  is_blocking: boolean;
  title: string;
  message: string;
  details: Record<string, unknown> | null;
  dedupe_key: string;
  first_detected_at: string;
  last_detected_at: string;
  created_at: string;
  updated_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface BlockedProjectViewRow {
  org_id: string;
  project_id: string;
  title: string;
  author_name: string | null;
  current_stage: string;
  project_status: string;
  due_date: string | null;
  project_last_activity_at: string;
  blocking_alerts_count: number;
  open_alerts_count: number;
  last_alert_at: string | null;
  open_alert_types: string[] | null;
}

