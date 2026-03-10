// =============================================================================
// Editorial — TypeScript Types
// Reino Editorial AI Engine · Phases 4A, 4B & 5
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─────────────────────────────────────────────────────────────────────────────
// Enums (mirror SQL enums)
// ─────────────────────────────────────────────────────────────────────────────

export const EDITORIAL_STAGES = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
] as const;

export type EditorialStage = (typeof EDITORIAL_STAGES)[number];

export const EDITORIAL_PROJECT_STATUSES = [
  "pending",
  "in_progress",
  "review",
  "approved",
  "rejected",
  "completed",
  "archived",
] as const;

export type EditorialProjectStatus = (typeof EDITORIAL_PROJECT_STATUSES)[number];

export const EDITORIAL_STAGE_STATUSES = [
  "pending",
  "in_progress",
  "review",
  "approved",
  "rejected",
] as const;

export type EditorialStageStatus = (typeof EDITORIAL_STAGE_STATUSES)[number];

export const EDITORIAL_JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type EditorialJobStatus = (typeof EDITORIAL_JOB_STATUSES)[number];

// Phase 4B
export const AI_FINDING_SEVERITIES = ["info", "warning", "error", "critical"] as const;
export type AiFindingSeverity = (typeof AI_FINDING_SEVERITIES)[number];

export const AI_FINDING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "fixed",
  "deferred",
] as const;
export type AiFindingStatus = (typeof AI_FINDING_STATUSES)[number];

export const AI_DECISION_TYPES = ["accept", "reject", "defer", "escalate"] as const;
export type AiDecisionType = (typeof AI_DECISION_TYPES)[number];

// Phase 5
export const AI_POLICY_TYPES = [
  "block",
  "warn",
  "require_approval",
  "auto_accept",
  "flag_review",
] as const;
export type AiPolicyType = (typeof AI_POLICY_TYPES)[number];

export const AI_PROMPT_VERSION_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "deprecated",
] as const;
export type AiPromptVersionStatus = (typeof AI_PROMPT_VERSION_STATUSES)[number];

export const AI_JOB_RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type AiJobRunStatus = (typeof AI_JOB_RUN_STATUSES)[number];

export const AI_QUALITY_CHECK_STATUSES = [
  "pending",
  "passed",
  "failed",
  "warning",
  "skipped",
] as const;
export type AiQualityCheckStatus = (typeof AI_QUALITY_CHECK_STATUSES)[number];

export const AI_FEEDBACK_TYPES = [
  "helpful",
  "not_helpful",
  "false_positive",
  "needs_improvement",
  "correct",
] as const;
export type AiFeedbackType = (typeof AI_FEEDBACK_TYPES)[number];

export const AI_AUDIT_ACTOR_TYPES = ["user", "system", "ai"] as const;
export type AiAuditActorType = (typeof AI_AUDIT_ACTOR_TYPES)[number];

export const AI_QUEUE_ITEM_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type AiQueueItemPriority = (typeof AI_QUEUE_ITEM_PRIORITIES)[number];

export const AI_QUEUE_ITEM_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "escalated",
] as const;
export type AiQueueItemStatus = (typeof AI_QUEUE_ITEM_STATUSES)[number];

export const AI_QUEUE_TYPES = [
  "finding_review",
  "prompt_approval",
  "quality_review",
  "policy_exception",
] as const;
export type AiQueueType = (typeof AI_QUEUE_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4A — Editorial Pipeline Base
// ─────────────────────────────────────────────────────────────────────────────

export interface EditorialProject {
  id: string;
  org_id: string;
  brand_id: string | null;
  tenant_id: string | null;
  title: string;
  author_name: string | null;
  slug: string | null;
  current_stage: EditorialStage;
  status: EditorialProjectStatus;
  metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateEditorialProjectInput = Pick<
  EditorialProject,
  "org_id" | "title" | "current_stage" | "status"
> &
  Partial<Pick<EditorialProject, "brand_id" | "tenant_id" | "author_name" | "slug" | "metadata" | "created_by">>;

export interface EditorialStageState {
  id: string;
  project_id: string;
  stage: EditorialStage;
  status: EditorialStageStatus;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialFile {
  id: string;
  project_id: string;
  stage: EditorialStage | null;
  name: string;
  file_url: string;
  file_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface EditorialJob {
  id: string;
  project_id: string;
  stage: EditorialStage;
  title: string;
  description: string | null;
  status: EditorialJobStatus;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  result_payload: Json | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialComment {
  id: string;
  project_id: string;
  stage: EditorialStage | null;
  job_id: string | null;
  parent_id: string | null;
  content: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4B — Editorial AI Automation
// ─────────────────────────────────────────────────────────────────────────────

export interface EditorialAiPromptTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  stage: EditorialStage | null;
  finding_type: string | null;
  task_type: string;
  prompt_text: string;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  is_active: boolean;
  output_schema: Json | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialAiFinding {
  id: string;
  project_id: string;
  job_id: string | null;
  stage: EditorialStage;
  prompt_template_id: string | null;
  finding_type: string;
  severity: AiFindingSeverity;
  title: string;
  description: string | null;
  location_ref: string | null;
  raw_output: Json | null;
  status: AiFindingStatus;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialAiFindingDecision {
  id: string;
  finding_id: string;
  decision: AiDecisionType;
  reason: string | null;
  decided_by: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — AI Quality & Governance
// ─────────────────────────────────────────────────────────────────────────────

// 1. Policies
export interface EditorialAiPolicy {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  applies_to_stage: EditorialStage | null;
  applies_to_finding_type: string | null;
  applies_to_severity: AiFindingSeverity | null;
  policy_type: AiPolicyType;
  conditions: Json;
  actions: Json;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateEditorialAiPolicyInput = Pick<
  EditorialAiPolicy,
  "org_id" | "name" | "policy_type"
> &
  Partial<
    Pick<
      EditorialAiPolicy,
      | "description"
      | "applies_to_stage"
      | "applies_to_finding_type"
      | "applies_to_severity"
      | "conditions"
      | "actions"
      | "is_active"
      | "priority"
      | "created_by"
    >
  >;

// 2. Model configs
export interface EditorialAiModelConfig {
  id: string;
  org_id: string;
  model_id: string;
  provider: string;
  display_name: string;
  description: string | null;
  capabilities: string[];
  default_temperature: number | null;
  default_max_tokens: number | null;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  context_window_tokens: number | null;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

// 3. Stage model rules
export interface EditorialAiStageModelRule {
  id: string;
  org_id: string;
  stage: EditorialStage;
  task_type: string;
  model_config_id: string;
  prompt_template_id: string | null;
  is_default: boolean;
  priority: number;
  constraints: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Resolved rule — includes the full model config and optional prompt template. */
export interface ResolvedStageModelRule extends EditorialAiStageModelRule {
  model_config: EditorialAiModelConfig;
  prompt_template: EditorialAiPromptTemplate | null;
}

// 4. Prompt versions
export interface EditorialAiPromptVersion {
  id: string;
  prompt_template_id: string;
  version_number: number;
  prompt_text: string;
  change_summary: string | null;
  status: AiPromptVersionStatus;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePromptVersionInput = Pick<
  EditorialAiPromptVersion,
  "prompt_template_id" | "prompt_text"
> &
  Partial<Pick<EditorialAiPromptVersion, "change_summary" | "submitted_by">>;

export type ApprovePromptVersionInput = {
  version_id: string;
  reviewed_by: string;
  review_notes?: string;
};

// 5. Job runs
export interface EditorialAiJobRun {
  id: string;
  job_id: string | null;
  project_id: string;
  stage: EditorialStage;
  prompt_template_id: string | null;
  prompt_version_id: string | null;
  model_config_id: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  duration_ms: number | null;
  status: AiJobRunStatus;
  input_payload: Json | null;
  output_payload: Json | null;
  error_message: string | null;
  initiated_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export type CreateJobRunInput = Pick<EditorialAiJobRun, "project_id" | "stage"> &
  Partial<
    Pick<
      EditorialAiJobRun,
      | "job_id"
      | "prompt_template_id"
      | "prompt_version_id"
      | "model_config_id"
      | "input_payload"
      | "initiated_by"
    >
  >;

export type CompleteJobRunInput = {
  run_id: string;
  status: AiJobRunStatus;
  output_payload?: Json;
  error_message?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  duration_ms?: number;
};

// 6. Quality checks
export interface EditorialAiQualityCheck {
  id: string;
  project_id: string;
  job_run_id: string | null;
  stage: EditorialStage;
  check_type: string;
  check_name: string;
  status: AiQualityCheckStatus;
  score: number | null;
  details: Json;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateQualityCheckInput = Pick<
  EditorialAiQualityCheck,
  "project_id" | "stage" | "check_type" | "check_name"
> &
  Partial<
    Pick<EditorialAiQualityCheck, "job_run_id" | "score" | "details" | "auto_resolved">
  >;

// 7. Quality scores
export interface EditorialAiQualityScore {
  id: string;
  project_id: string;
  stage: EditorialStage | null;
  score_type: string;
  score: number;
  weight: number;
  computed_at: string;
  metadata: Json;
  created_at: string;
}

// 8. Finding feedback
export interface EditorialAiFindingFeedback {
  id: string;
  finding_id: string;
  feedback_type: AiFeedbackType;
  comment: string | null;
  rating: number | null;
  submitted_by: string | null;
  created_at: string;
}

export type CreateFindingFeedbackInput = Pick<
  EditorialAiFindingFeedback,
  "finding_id" | "feedback_type"
> &
  Partial<Pick<EditorialAiFindingFeedback, "comment" | "rating" | "submitted_by">>;

// 9. Audit events
export interface EditorialAiAuditEvent {
  id: string;
  org_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_type: AiAuditActorType;
  previous_state: Json | null;
  new_state: Json | null;
  metadata: Json;
  created_at: string;
}

export type CreateAuditEventInput = Pick<
  EditorialAiAuditEvent,
  "org_id" | "entity_type" | "entity_id" | "action"
> &
  Partial<
    Pick<
      EditorialAiAuditEvent,
      "actor_id" | "actor_type" | "previous_state" | "new_state" | "metadata"
    >
  >;

// 10. Review queues
export interface EditorialAiReviewQueue {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  queue_type: AiQueueType;
  stage: EditorialStage | null;
  assigned_role: string | null;
  auto_assign_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 11. Queue items
export interface EditorialAiQueueItem {
  id: string;
  queue_id: string;
  entity_type: string;
  entity_id: string;
  project_id: string | null;
  priority: AiQueueItemPriority;
  status: AiQueueItemStatus;
  assigned_to: string | null;
  due_at: string | null;
  context: Json;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  completed_by: string | null;
}

export type CreateQueueItemInput = Pick<
  EditorialAiQueueItem,
  "queue_id" | "entity_type" | "entity_id"
> &
  Partial<
    Pick<
      EditorialAiQueueItem,
      "project_id" | "priority" | "assigned_to" | "due_at" | "context"
    >
  >;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard / aggregation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Aggregated quality dashboard for a single project. */
export interface ProjectQualityDashboard {
  project_id: string;
  project_title: string;
  overall_score: number | null;
  stage_scores: Record<EditorialStage, number | null>;
  open_findings: number;
  critical_findings: number;
  pending_queue_items: number;
  last_job_run_at: string | null;
}

/** Summary row for the governance dashboard. */
export interface GovernanceSummary {
  org_id: string;
  total_policies: number;
  active_policies: number;
  total_models: number;
  active_models: number;
  pending_prompt_approvals: number;
  open_queue_items: number;
  audit_events_last_24h: number;
}
