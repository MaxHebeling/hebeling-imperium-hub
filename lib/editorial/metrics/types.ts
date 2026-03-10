export type StageStatus =
  | "pending"
  | "queued"
  | "processing"
  | "review_required"
  | "approved"
  | "failed"
  | "completed"
  | string;

export interface ProjectCurrentStageRow {
  org_id: string;
  project_id: string;
  title: string;
  author_name: string | null;
  project_status: string;
  current_stage: string;
  due_date: string | null;
  project_created_at: string;
  project_last_activity_at: string;
  stage_id: string | null;
  stage_key: string | null;
  stage_status: StageStatus | null;
  started_at: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

export interface StageMetricsRow {
  org_id: string;
  stage_key: string;
  stage_status: StageStatus;
  stage_count: number;
  avg_duration_hours: number | null;
  oldest_stage_created_at: string | null;
  newest_stage_created_at: string | null;
}

export type SlaState = "none" | "on_track" | "at_risk" | "breached" | string;
export type InactivityState = "ok" | "at_risk" | "critical" | string;

export interface ProjectSlaRow {
  org_id: string;
  project_id: string;
  title: string;
  project_status: string;
  current_stage: string;
  due_date: string | null;
  project_last_activity_at: string;
  days_to_due: number | null;
  days_since_activity: number | null;
  sla_state: SlaState;
  inactivity_state: InactivityState;
}

export interface StaffWorkloadRow {
  org_id: string;
  user_id: string;
  role: string;
  assigned_projects_count: number;
  review_queue_count: number;
  in_progress_count: number;
  completed_count: number;
  oldest_assigned_activity_at: string | null;
  newest_assigned_activity_at: string | null;
}

