// ============================================================
// Phase 4A — Editorial Workflow Intelligence
// TypeScript types for Reino Editorial AI Engine
// ============================================================

// ---- Enums ----

export type EditorialStage =
  | "ingesta"
  | "estructura"
  | "estilo"
  | "ortotipografia"
  | "maquetacion"
  | "revision_final";

export type EditorialStageStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "reopened";

export type EditorialEventType =
  | "book_created"
  | "stage_started"
  | "stage_completed"
  | "stage_blocked"
  | "stage_reopened"
  | "checklist_item_checked"
  | "checklist_item_unchecked"
  | "member_assigned"
  | "member_unassigned"
  | "alert_created"
  | "alert_resolved"
  | "override_applied";

export type EditorialAlertSeverity = "info" | "warning" | "critical";

export type EditorialAlertType =
  | "no_assignee"
  | "incomplete_checklist"
  | "stage_overdue"
  | "missing_output"
  | "blocked_progression";

export type EditorialRole =
  | "editor_jefe"
  | "editor"
  | "corrector"
  | "disenador"
  | "revisor";

// ---- Stage ordered list (for timeline display) ----

export const EDITORIAL_STAGES: EditorialStage[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
];

export const EDITORIAL_STAGE_LABELS: Record<EditorialStage, string> = {
  ingesta: "Ingesta",
  estructura: "Estructura",
  estilo: "Estilo",
  ortotipografia: "Ortotipografía",
  maquetacion: "Maquetación",
  revision_final: "Revisión Final",
};

export const EDITORIAL_STAGE_COLORS: Record<EditorialStage, string> = {
  ingesta: "bg-slate-500",
  estructura: "bg-amber-500",
  estilo: "bg-pink-500",
  ortotipografia: "bg-purple-500",
  maquetacion: "bg-blue-500",
  revision_final: "bg-emerald-500",
};

export const EDITORIAL_STATUS_LABELS: Record<EditorialStageStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completado",
  blocked: "Bloqueado",
  reopened: "Reabierto",
};

export const EDITORIAL_ROLE_LABELS: Record<EditorialRole, string> = {
  editor_jefe: "Editor Jefe",
  editor: "Editor",
  corrector: "Corrector",
  disenador: "Diseñador",
  revisor: "Revisor",
};

// ---- Core entities ----

export interface EditorialBook {
  id: string;
  org_id: string;
  brand_id: string | null;
  title: string;
  author: string | null;
  isbn: string | null;
  current_stage: EditorialStage;
  overall_status: EditorialStageStatus;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialBookMember {
  id: string;
  book_id: string;
  user_id: string;
  editorial_role: EditorialRole;
  can_advance_stage: boolean;
  can_reopen_stage: boolean;
  can_override_rules: boolean;
  assigned_stages: EditorialStage[];
  assigned_at: string;
  // joined
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface EditorialStageRuleDefinition {
  id: string;
  org_id: string;
  stage: EditorialStage;
  rule_key: string;
  rule_label: string;
  description: string | null;
  is_blocking: boolean;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface EditorialChecklistTemplate {
  id: string;
  org_id: string;
  stage: EditorialStage;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  // joined
  items?: EditorialChecklistTemplateItem[];
}

export interface EditorialChecklistTemplateItem {
  id: string;
  template_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  position: number;
  created_at: string;
}

export interface EditorialBookStageChecklist {
  id: string;
  book_id: string;
  stage: EditorialStage;
  template_id: string | null;
  status: EditorialStageStatus;
  assignee_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  // joined
  items?: EditorialChecklistItem[];
  assignee?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface EditorialChecklistItem {
  id: string;
  checklist_id: string;
  template_item_id: string | null;
  label: string;
  is_required: boolean;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  position: number;
  // joined
  checked_by_profile?: {
    full_name: string | null;
  };
}

export interface EditorialWorkflowEvent {
  id: string;
  book_id: string;
  org_id: string;
  event_type: EditorialEventType;
  stage: EditorialStage | null;
  performed_by: string | null;
  target_user_id: string | null;
  payload: Record<string, unknown>;
  reason: string | null;
  is_override: boolean;
  override_reason: string | null;
  created_at: string;
  // joined
  performer?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface EditorialBookAlert {
  id: string;
  book_id: string;
  org_id: string;
  alert_type: EditorialAlertType;
  severity: EditorialAlertSeverity;
  stage: EditorialStage | null;
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ---- View types ----

export interface EditorialBookCurrentStageView {
  book_id: string;
  org_id: string;
  brand_id: string | null;
  title: string;
  author: string | null;
  current_stage: EditorialStage;
  overall_status: EditorialStageStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  checklist_id: string | null;
  stage_status: EditorialStageStatus | null;
  assignee_id: string | null;
  assignee_name: string | null;
  required_items_total: number;
  required_items_done: number;
}

export interface EditorialBlockedBookView {
  book_id: string;
  org_id: string;
  title: string;
  current_stage: EditorialStage;
  overall_status: EditorialStageStatus;
  due_date: string | null;
  alert_count: number;
  critical_alert_count: number;
  warning_alert_count: number;
  latest_alert_at: string;
}

export interface EditorialStageMetricsView {
  org_id: string;
  stage: EditorialStage;
  books_in_stage: number;
  blocked_count: number;
  in_progress_count: number;
  avg_days_in_stage: number | null;
}

export interface EditorialStaffWorkloadView {
  user_id: string;
  org_id: string;
  full_name: string | null;
  email: string | null;
  books_assigned: number;
  active_checklists: number;
}

// ---- Rules engine types ----

export interface RuleViolation {
  rule_key: string;
  rule_label: string;
  message: string;
  is_blocking: boolean;
  severity: EditorialAlertSeverity;
}

export interface StageValidationResult {
  can_advance: boolean;
  violations: RuleViolation[];
  warnings: RuleViolation[];
}

// ---- API request/response types ----

export interface CreateEditorialBookInput {
  title: string;
  author?: string;
  isbn?: string;
  due_date?: string;
  notes?: string;
  brand_id?: string;
}

export interface UpdateEditorialBookInput {
  title?: string;
  author?: string;
  isbn?: string;
  due_date?: string | null;
  notes?: string | null;
  brand_id?: string | null;
}

export interface AdvanceStageInput {
  book_id: string;
  from_stage: EditorialStage;
  to_stage: EditorialStage;
  is_override?: boolean;
  override_reason?: string;
}

export interface ReopenStageInput {
  book_id: string;
  stage: EditorialStage;
  reason: string;
}

export interface AssignStageInput {
  book_id: string;
  stage: EditorialStage;
  assignee_id: string;
}

export interface ToggleChecklistItemInput {
  item_id: string;
  is_checked: boolean;
}

export interface ResolveAlertInput {
  alert_id: string;
}

export interface EditorialMetrics {
  total_books: number;
  books_by_stage: Record<EditorialStage, number>;
  blocked_books: number;
  completed_this_month: number;
  avg_days_per_stage: Record<EditorialStage, number | null>;
  staff_workload: EditorialStaffWorkloadView[];
}
