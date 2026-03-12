export type EditorialFileVisibility = "internal" | "client" | "public";

export type EditorialStageKey =
  | "ingesta"
  | "estructura"
  | "estilo"
  | "ortotipografia"
  | "maquetacion"
  | "revision_final";

export type EditorialStageStatus =
  | "pending"
  | "queued"
  | "processing"
  | "review_required"
  | "approved"
  | "failed"
  | "completed";

export interface EditorialProject {
  id: string;
  org_id: string;
  client_id: string | null;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  language: string;
  genre: string | null;
  target_audience: string | null;
  word_count: number | null;
  page_estimate: number | null;
  current_stage: EditorialStageKey;
  status: string;
  progress_percent: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialStage {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  status: EditorialStageStatus;
  started_at: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  retry_count: number;
  notes: string | null;
  created_at: string;
}

export interface EditorialFile {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  file_type: string;
  version: number;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  visibility: EditorialFileVisibility;
  created_at: string;
}

export interface EditorialJob {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  job_type: string;
  provider: string | null;
  status: string;
  input_ref: string | null;
  output_ref: string | null;
  error_log: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface EditorialComment {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  author_type: string | null;
  author_id: string | null;
  comment: string;
  visibility: string;
  created_at: string;
}

export interface EditorialExport {
  id: string;
  project_id: string;
  export_type: string;
  version: number;
  storage_path: string;
  status: string;
  checksum: string | null;
  created_at: string;
}

/** One row from editorial_activity_log (audit trail). */
export interface EditorialActivityLogEntry {
  id: string;
  project_id: string;
  stage_key: string | null;
  event_type: string;
  actor_id: string | null;
  actor_type: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface StaffActivityLogEntry extends EditorialActivityLogEntry {
  stage_key: EditorialStageKey | null;
  actor_name: string | null;
  actor_email: string | null;
}

/** Staff list item: project + creator profile for display. */
export interface StaffProjectListItem extends EditorialProject {
  progress_percent: number; // computed from current_stage (single source of truth)
  created_by_email: string | null;
  created_by_name: string | null;
  last_activity_at: string | null; // project.updated_at
}

/** Dashboard aggregates and recent projects. */
export interface StaffDashboardData {
  projectsCount: number;
  inReviewCount: number;
  completedThisMonthCount: number;
  recentProjects: StaffProjectListItem[];
}

/** Stage with approver profile for staff UI. */
export interface StageWithApprover extends EditorialStage {
  approved_by_name: string | null;
  approved_by_email: string | null;
}

export type EditorialStaffAssignmentRole =
  | "manager"
  | "editor"
  | "reviewer"
  | "proofreader"
  | "designer";

export type EditorialCapability =
  | "stage:update_status"
  | "stage:approve"
  | "stage:reopen"
  | "files:upload"
  | "files:read"
  | "comments:create"
  | "assignment:change"
  | "rule:override"
  | "ai:run"
  | "ai:review";

export type EditorialStageRuleType = "entry" | "exit" | "transition" | "blocking";

export type EditorialStageRuleSeverity = "info" | "warning" | "blocking" | "critical";

export interface EditorialStageRuleDefinition {
  id: string;
  org_id: string;
  stage_key: EditorialStageKey;
  rule_type: EditorialStageRuleType;
  rule_key: string;
  severity: EditorialStageRuleSeverity;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export type StageGateReasonCode =
  | "checklist_incomplete"
  | "missing_required_file"
  | "rule_failed"
  | "no_checklist_template"
  | "no_checklist_instance";

export interface StageGateReason {
  code: StageGateReasonCode;
  message: string;
  blocking: boolean;
  stage_key: EditorialStageKey;
  rule_key?: string;
  checklist_id?: string;
  item_key?: string;
  required_file_types?: string[];
}

export interface StageGateEvaluation {
  canComplete: boolean;
  reasons: StageGateReason[];
  checklist?: {
    checklist_id: string | null;
    progress_percent: number | null;
    completed_required: number | null;
    total_required: number | null;
  } | null;
}

export interface EditorialStageChecklistTemplate {
  id: string;
  org_id: string;
  stage_key: EditorialStageKey;
  name: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialStageChecklistTemplateItem {
  id: string;
  template_id: string;
  item_key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_required: boolean;
  requires_file: boolean;
  required_file_types: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialProjectStageChecklist {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  template_id: string | null;
  status: "open" | "completed";
  progress_percent: number;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

export interface EditorialProjectStageChecklistItem {
  id: string;
  checklist_id: string;
  template_item_id: string | null;
  item_key: string;
  label: string;
  sort_order: number;
  is_required: boolean;
  requires_file: boolean;
  required_file_types: string[] | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

export interface EditorialProjectUserCapabilities {
  id: string;
  project_id: string;
  user_id: string;
  allow: EditorialCapability[];
  deny: EditorialCapability[];
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialProjectRoleCapabilities {
  id: string;
  org_id: string;
  role: EditorialStaffAssignmentRole;
  capabilities: EditorialCapability[];
  created_at: string;
  updated_at: string | null;
}

export type EditorialWorkflowEventType =
  | "stage_started"
  | "stage_completed"
  | "stage_reopened"
  | "checklist_item_completed"
  | "checklist_completed"
  | "assignment_changed"
  | "rule_override_applied"
  | "manuscript_submitted";

export interface EditorialWorkflowEvent {
  id: string;
  org_id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  event_type: EditorialWorkflowEventType | string;
  actor_id: string | null;
  actor_role: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface EditorialProjectStaffAssignment {
  id: string;
  project_id: string;
  user_id: string;
  role: EditorialStaffAssignmentRole;
  assigned_by: string | null;
  assigned_at: string;
  user_full_name: string | null;
  user_email: string | null;
}

/** Project member with optional profile for display. */
export interface StaffProjectMember {
  id: string;
  user_id: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  email: string | null;
  full_name: string | null;
}

/** Full project detail for staff (project + stages, files, comments, activity, members). */
export interface StaffProjectDetail {
  project: EditorialProject & { progress_percent: number };
  stages: StageWithApprover[];
  files: EditorialFile[];
  comments: EditorialComment[];
  activity: StaffActivityLogEntry[];
  members: StaffProjectMember[];
  staffAssignments: EditorialProjectStaffAssignment[];
  created_by_email: string | null;
  created_by_name: string | null;
}
