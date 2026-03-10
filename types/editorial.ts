// =============================================================================
// Editorial — TypeScript Types
// Reino Editorial AI Engine · Phases 4A, 4B, 5, 6, 7, 8, 9, 10, 11 & 12
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

// =============================================================================
// Phase 6 — Editorial AI Workspace
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const DOCUMENT_CHANGE_SOURCES = [
  "manual",
  "ai_accepted",
  "ai_edited",
] as const;
export type DocumentChangeSource = (typeof DOCUMENT_CHANGE_SOURCES)[number];

export const DOCUMENT_VERSION_SOURCES = [
  "manual",
  "ai_applied",
  "import",
  "restore",
] as const;
export type DocumentVersionSource = (typeof DOCUMENT_VERSION_SOURCES)[number];

/** Available inline AI actions the editor can request on a selected fragment. */
export const INLINE_AI_ACTIONS = [
  "improve_clarity",
  "rewrite_paragraph",
  "correct_grammar",
  "summarize",
  "expand",
  "adjust_tone",
  "smooth_transition",
] as const;
export type InlineAiAction = (typeof INLINE_AI_ACTIONS)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

/** An editor's working session on a project+stage. */
export interface EditorialEditSession {
  id: string;
  project_id: string;
  stage: EditorialStage;
  editor_id: string;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  metadata: Json;
}

/** Immutable snapshot of the manuscript content at a point in time. */
export interface EditorialDocumentVersion {
  id: string;
  project_id: string;
  stage: EditorialStage;
  version_number: number;
  content: string;
  source: DocumentVersionSource;
  job_run_id: string | null;
  created_by: string | null;
  created_at: string;
}

/** One granular change record (AI-accepted or manual). */
export interface EditorialDocumentChange {
  id: string;
  project_id: string;
  stage: EditorialStage;
  from_version_id: string | null;
  to_version_id: string | null;
  location_ref: string | null;
  original_text: string | null;
  revised_text: string | null;
  change_source: DocumentChangeSource;
  finding_id: string | null;
  decision_id: string | null;
  session_id: string | null;
  applied_by: string | null;
  applied_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateEditSessionInput = Pick<
  EditorialEditSession,
  "project_id" | "stage" | "editor_id"
> & Partial<Pick<EditorialEditSession, "metadata">>;

export type CreateDocumentVersionInput = Pick<
  EditorialDocumentVersion,
  "project_id" | "stage" | "content" | "source"
> &
  Partial<
    Pick<EditorialDocumentVersion, "job_run_id" | "created_by">
  >;

export type CreateDocumentChangeInput = Pick<
  EditorialDocumentChange,
  "project_id" | "stage" | "change_source"
> &
  Partial<
    Pick<
      EditorialDocumentChange,
      | "from_version_id"
      | "to_version_id"
      | "location_ref"
      | "original_text"
      | "revised_text"
      | "finding_id"
      | "decision_id"
      | "session_id"
      | "applied_by"
    >
  >;

// ── Workspace view models ─────────────────────────────────────────────────────

/** Full workspace context loaded by the workspace-service. */
export interface WorkspaceContext {
  project: EditorialProject;
  stage: EditorialStage;
  currentVersion: EditorialDocumentVersion | null;
  activeSession: EditorialEditSession | null;
}

/**
 * A finding enriched with its decision for display in the workspace sidebar.
 * Extends EditorialAiFinding with the resolved decision if any.
 */
export interface WorkspaceFinding extends EditorialAiFinding {
  decision: EditorialAiFindingDecision | null;
  qualityScore: number | null;
}

/** Result of an inline AI action call. */
export interface InlineAiResult {
  action: InlineAiAction;
  original_text: string;
  suggested_text: string;
  /** Confidence in [0, 1]; null when not reported by the model. */
  confidence: number | null;
  /** Reference to the job run that produced this result. */
  job_run_id: string | null;
}

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

// =============================================================================
// Phase 7 — Publishing Engine
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const PUBLICATION_VERSION_STATUSES = [
  "draft",
  "ready",
  "exported",
  "archived",
] as const;
export type PublicationVersionStatus = (typeof PUBLICATION_VERSION_STATUSES)[number];

export const EXPORT_FORMATS = [
  "pdf_print",
  "epub",
  "kindle_mobi",
  "kindle_kpf",
  "html",
] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type ExportRunStatus = (typeof EXPORT_RUN_STATUSES)[number];

export const DISTRIBUTION_CHANNELS = [
  "amazon_kdp",
  "apple_books",
  "google_play_books",
  "ingram_spark",
  "smashwords",
  "internal",
] as const;
export type DistributionChannel = (typeof DISTRIBUTION_CHANNELS)[number];

export const DISTRIBUTION_PACKAGE_STATUSES = [
  "pending",
  "ready",
  "submitted",
  "accepted",
  "rejected",
] as const;
export type DistributionPackageStatus =
  (typeof DISTRIBUTION_PACKAGE_STATUSES)[number];

// ── Contributor shape stored in metadata.contributors ────────────────────────

export interface PublicationContributor {
  name: string;
  role: "editor" | "translator" | "illustrator" | "foreword" | "other";
}

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialPublicationVersion {
  id: string;
  project_id: string;
  label: string;
  version_tag: string;
  status: PublicationVersionStatus;
  source_document_version_id: string | null;
  source_stage: EditorialStage | null;
  source_file_id: string | null;
  editorial_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialPublicationMetadata {
  id: string;
  publication_version_id: string;
  project_id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  contributors: PublicationContributor[];
  publisher_name: string | null;
  imprint: string | null;
  publication_date: string | null;
  edition_number: number;
  isbn_13: string | null;
  isbn_10: string | null;
  asin: string | null;
  doi: string | null;
  language: string;
  description: string | null;
  keywords: string[] | null;
  bisac_codes: string[] | null;
  thema_codes: string[] | null;
  rights: string | null;
  territories: string[] | null;
  cover_image_url: string | null;
  cover_storage_path: string | null;
  extra_metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface EditorialExportRun {
  id: string;
  project_id: string;
  publication_version_id: string;
  format: ExportFormat;
  status: ExportRunStatus;
  output_file_url: string | null;
  output_storage_path: string | null;
  output_size_bytes: number | null;
  engine: string | null;
  engine_version: string | null;
  export_config: Json;
  error_message: string | null;
  error_details: Json | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  initiated_by: string | null;
  created_at: string;
}

export interface EditorialDistributionPackage {
  id: string;
  project_id: string;
  publication_version_id: string;
  channel: DistributionChannel;
  status: DistributionPackageStatus;
  export_run_ids: string[];
  manifest: Json;
  submission_id: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  channel_response: Json | null;
  response_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreatePublicationVersionInput = Pick<
  EditorialPublicationVersion,
  "project_id" | "label" | "version_tag"
> &
  Partial<
    Pick<
      EditorialPublicationVersion,
      | "source_document_version_id"
      | "source_stage"
      | "source_file_id"
      | "editorial_notes"
      | "created_by"
    >
  >;

export type UpsertPublicationMetadataInput = Pick<
  EditorialPublicationMetadata,
  "publication_version_id" | "project_id" | "title"
> &
  Partial<
    Omit<EditorialPublicationMetadata, "id" | "created_at" | "updated_at">
  >;

export type CreateExportRunInput = Pick<
  EditorialExportRun,
  "project_id" | "publication_version_id" | "format"
> &
  Partial<
    Pick<EditorialExportRun, "engine" | "engine_version" | "export_config" | "initiated_by">
  >;

export type CreateDistributionPackageInput = Pick<
  EditorialDistributionPackage,
  "project_id" | "publication_version_id" | "channel"
> &
  Partial<
    Pick<EditorialDistributionPackage, "export_run_ids" | "manifest">
  >;

// ── View models ───────────────────────────────────────────────────────────────

/** Full publishing context loaded for the PublishingDashboard page. */
export interface ProjectPublishingContext {
  project: EditorialProject;
  publicationVersions: EditorialPublicationVersion[];
  latestVersion: EditorialPublicationVersion | null;
  latestMetadata: EditorialPublicationMetadata | null;
  recentExports: EditorialExportRun[];
  distributionPackages: EditorialDistributionPackage[];
  /** Pre-export readiness gate result. */
  readinessCheck: PublishingReadinessResult;
}

/** Result of the pre-export validation gate. */
export interface PublishingReadinessResult {
  ready: boolean;
  checks: {
    stage_is_final: boolean;
    no_open_critical_findings: boolean;
    metadata_complete: boolean;
    has_approved_version: boolean;
  };
  blockers: string[];
}

// =============================================================================
// Phase 8 — Editorial Platform / Marketplace
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const MARKETPLACE_ORDER_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "delivered",
  "revision_requested",
  "completed",
  "cancelled",
] as const;
export type MarketplaceOrderStatus = (typeof MARKETPLACE_ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "escrow",
  "released",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ── Attachment shape used in order messages ───────────────────────────────────

export interface OrderMessageAttachment {
  name: string;
  url: string;
  type: string;
  size_bytes?: number;
}

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialProfessional {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  country: string | null;
  languages: string[] | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  verified: boolean;
  rating: number;
  total_projects: number;
  created_at: string;
}

export interface EditorialServiceListing {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number | null;
  currency: string;
  delivery_days: number | null;
  active: boolean;
  rating: number;
  orders_count: number;
  created_at: string;
}

export interface EditorialMarketplaceOrder {
  id: string;
  project_id: string;
  service_id: string;
  buyer_id: string;
  provider_id: string;
  status: MarketplaceOrderStatus;
  price: number | null;
  currency: string;
  delivery_date: string | null;
  created_at: string;
}

export interface EditorialOrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message: string | null;
  attachments: OrderMessageAttachment[];
  created_at: string;
}

export interface EditorialOrderDeliverable {
  id: string;
  order_id: string;
  file_id: string | null;
  version: number;
  notes: string | null;
  created_at: string;
}

export interface EditorialReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface EditorialPayment {
  id: string;
  order_id: string;
  amount: number | null;
  currency: string;
  payment_provider: string | null;
  transaction_id: string | null;
  status: PaymentStatus;
  released_at: string | null;
  created_at: string;
}

export interface EditorialAiMatch {
  id: string;
  project_id: string;
  professional_id: string;
  match_score: number;
  reason: string | null;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateProfessionalInput = Pick<
  EditorialProfessional,
  "user_id" | "display_name"
> &
  Partial<
    Pick<
      EditorialProfessional,
      "bio" | "country" | "languages" | "specialties" | "portfolio_url"
    >
  >;

export type CreateServiceListingInput = Pick<
  EditorialServiceListing,
  "professional_id" | "title" | "category"
> &
  Partial<
    Pick<
      EditorialServiceListing,
      "description" | "price" | "currency" | "delivery_days"
    >
  >;

export type CreateMarketplaceOrderInput = Pick<
  EditorialMarketplaceOrder,
  "project_id" | "service_id" | "buyer_id" | "provider_id"
> &
  Partial<
    Pick<EditorialMarketplaceOrder, "price" | "currency" | "delivery_date">
  >;

export type CreateOrderMessageInput = Pick<
  EditorialOrderMessage,
  "order_id" | "sender_id"
> & {
  message?: string;
  attachments?: OrderMessageAttachment[];
};

export type CreateOrderDeliverableInput = Pick<
  EditorialOrderDeliverable,
  "order_id"
> &
  Partial<Pick<EditorialOrderDeliverable, "file_id" | "version" | "notes">>;

export type CreateReviewInput = Pick<
  EditorialReview,
  "order_id" | "reviewer_id" | "provider_id" | "rating"
> & Partial<Pick<EditorialReview, "comment">>;

// ── View models ───────────────────────────────────────────────────────────────

/** A service listing enriched with the professional's public info. */
export interface ServiceListingWithProfessional extends EditorialServiceListing {
  professional: Pick<
    EditorialProfessional,
    "id" | "display_name" | "country" | "rating" | "verified" | "specialties"
  >;
}

/** An order enriched with service and basic user info. */
export interface OrderWithDetails extends EditorialMarketplaceOrder {
  service: Pick<EditorialServiceListing, "id" | "title" | "category">;
  payment: EditorialPayment | null;
  deliverables_count: number;
  messages_count: number;
}

/** AI match enriched with the professional's public listing info. */
export interface AiMatchWithProfessional extends EditorialAiMatch {
  professional: EditorialProfessional;
  top_listing: EditorialServiceListing | null;
}

// =============================================================================
// Phase 9 — Global Book Distribution Engine
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const DISTRIBUTION_CHANNEL_TYPES = [
  "retail",
  "pod",
  "wholesale",
  "direct",
  "aggregator",
] as const;
export type DistributionChannelType = (typeof DISTRIBUTION_CHANNEL_TYPES)[number];

export const DISTRIBUTION_FORMAT_TYPES = [
  "paperback",
  "hardcover",
  "ebook",
  "audiobook",
] as const;
export type DistributionFormatType = (typeof DISTRIBUTION_FORMAT_TYPES)[number];

export const DISTRIBUTION_SUBMISSION_STATUSES = [
  "draft",
  "queued",
  "validating",
  "submitted",
  "processing",
  "action_required",
  "approved",
  "published",
  "rejected",
  "failed",
  "paused",
  "unpublished",
] as const;
export type DistributionSubmissionStatus =
  (typeof DISTRIBUTION_SUBMISSION_STATUSES)[number];

export const DISTRIBUTION_IDENTIFIER_TYPES = [
  "external_book_id",
  "asin",
  "apple_id",
  "google_id",
  "kobo_id",
  "bn_id",
  "ingram_id",
  "sku",
  "listing_url",
  "other",
] as const;
export type DistributionIdentifierType =
  (typeof DISTRIBUTION_IDENTIFIER_TYPES)[number];

export const DISTRIBUTION_ARTIFACT_TYPES = [
  "metadata_export",
  "interior_pdf",
  "cover_pdf",
  "epub",
  "mobi",
  "kpf",
  "thumbnail",
  "marketing_image",
  "pod_package",
  "compliance_report",
  "submission_receipt",
  "other",
] as const;
export type DistributionArtifactType =
  (typeof DISTRIBUTION_ARTIFACT_TYPES)[number];

export const DISTRIBUTION_ISSUE_SEVERITIES = [
  "info",
  "warning",
  "error",
  "critical",
] as const;
export type DistributionIssueSeverity =
  (typeof DISTRIBUTION_ISSUE_SEVERITIES)[number];

export const DISTRIBUTION_ISSUE_STATUSES = [
  "open",
  "acknowledged",
  "resolved",
  "ignored",
] as const;
export type DistributionIssueStatus =
  (typeof DISTRIBUTION_ISSUE_STATUSES)[number];

export const DISTRIBUTION_JOB_TYPES = [
  "prepare_metadata",
  "validate_package",
  "generate_export",
  "submit_to_channel",
  "sync_status",
  "pull_identifiers",
  "publish",
  "unpublish",
  "retry_failed_submission",
] as const;
export type DistributionJobType = (typeof DISTRIBUTION_JOB_TYPES)[number];

export const DISTRIBUTION_JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type DistributionJobStatus = (typeof DISTRIBUTION_JOB_STATUSES)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialDistributionChannel {
  id: string;
  code: string;
  name: string;
  channel_type: DistributionChannelType;
  active: boolean;
  supports_print: boolean;
  supports_ebook: boolean;
  supports_audiobook: boolean;
  metadata_schema: Json | null;
  created_at: string;
}

export interface BookContributor {
  name: string;
  role: string;
}

export interface EditorialBookMetadata {
  id: string;
  project_id: string;
  title: string;
  subtitle: string | null;
  series_name: string | null;
  series_number: string | null;
  author_display_name: string;
  contributors: BookContributor[];
  description_short: string | null;
  description_long: string | null;
  language_code: string | null;
  publication_date: string | null;
  edition_label: string | null;
  isbn_print: string | null;
  isbn_ebook: string | null;
  isbn_hardcover: string | null;
  bisac_codes: string[] | null;
  keywords: string[] | null;
  territory_rights: string[] | null;
  age_range: string | null;
  audience: string | null;
  copyright_holder: string | null;
  publisher_name: string | null;
  imprint_name: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialDistributionFormat {
  id: string;
  project_id: string;
  format_type: DistributionFormatType;
  enabled: boolean;
  interior_file_id: string | null;
  cover_file_id: string | null;
  preview_file_id: string | null;
  page_count: number | null;
  trim_size: string | null;
  paper_type: string | null;
  binding_type: string | null;
  created_at: string;
}

export interface EditorialDistributionSubmission {
  id: string;
  project_id: string;
  channel_id: string;
  format_id: string | null;
  submitted_by: string | null;
  status: DistributionSubmissionStatus;
  submission_payload: Json | null;
  channel_response: Json | null;
  submitted_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialDistributionIdentifier {
  id: string;
  submission_id: string;
  identifier_type: DistributionIdentifierType;
  identifier_value: string;
  created_at: string;
}

export interface EditorialDistributionArtifact {
  id: string;
  submission_id: string;
  artifact_type: DistributionArtifactType;
  file_id: string | null;
  storage_path: string | null;
  version: number;
  notes: string | null;
  created_at: string;
}

export interface EditorialDistributionIssue {
  id: string;
  submission_id: string;
  severity: DistributionIssueSeverity;
  issue_code: string | null;
  title: string;
  description: string | null;
  field_path: string | null;
  status: DistributionIssueStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface EditorialDistributionEvent {
  id: string;
  submission_id: string;
  event_type: string;
  actor_user_id: string | null;
  old_status: string | null;
  new_status: string | null;
  payload: Json | null;
  created_at: string;
}

export interface EditorialDistributionJob {
  id: string;
  submission_id: string | null;
  project_id: string | null;
  channel_id: string | null;
  job_type: DistributionJobType;
  status: DistributionJobStatus;
  attempt_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  input_payload: Json | null;
  output_payload: Json | null;
  error_message: string | null;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type UpsertBookMetadataInput = Pick<
  EditorialBookMetadata,
  "project_id" | "title" | "author_display_name"
> &
  Partial<
    Omit<EditorialBookMetadata, "id" | "created_at" | "updated_at">
  >;

export type CreateDistributionFormatInput = Pick<
  EditorialDistributionFormat,
  "project_id" | "format_type"
> &
  Partial<
    Pick<
      EditorialDistributionFormat,
      | "enabled"
      | "interior_file_id"
      | "cover_file_id"
      | "preview_file_id"
      | "page_count"
      | "trim_size"
      | "paper_type"
      | "binding_type"
    >
  >;

export type CreateDistributionSubmissionInput = Pick<
  EditorialDistributionSubmission,
  "project_id" | "channel_id"
> &
  Partial<
    Pick<
      EditorialDistributionSubmission,
      "format_id" | "submitted_by" | "submission_payload"
    >
  >;

export type CreateDistributionJobInput = Pick<
  EditorialDistributionJob,
  "job_type"
> & {
  project_id?: string;
  submission_id?: string;
  channel_id?: string;
} & Partial<
    Pick<
      EditorialDistributionJob,
      "input_payload" | "scheduled_at"
    >
  >;

// ── View models ───────────────────────────────────────────────────────────────

/** Full distribution context for a single project. */
export interface ProjectDistributionContext {
  project: EditorialProject;
  metadata: EditorialBookMetadata | null;
  formats: EditorialDistributionFormat[];
  submissions: DistributionSubmissionWithChannel[];
  openIssuesCount: number;
  pendingJobsCount: number;
}

/** A submission enriched with the channel's display info. */
export interface DistributionSubmissionWithChannel
  extends EditorialDistributionSubmission {
  channel: Pick<
    EditorialDistributionChannel,
    "id" | "code" | "name" | "channel_type" | "supports_print" | "supports_ebook"
  >;
  identifiers: EditorialDistributionIdentifier[];
  open_issues_count: number;
}

// =============================================================================
// Phase 10 — Reino Editorial OS / Unified Operating System
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const ASSIGNMENT_ROLES = [
  "project_manager",
  "developmental_editor",
  "line_editor",
  "copy_editor",
  "proofreader",
  "designer",
  "formatter",
  "qa_reviewer",
  "distribution_manager",
  "customer_success_manager",
  "operations_lead",
  "other",
] as const;
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = [
  "open",
  "queued",
  "in_progress",
  "blocked",
  "review",
  "completed",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const SLA_SCOPE_TYPES = [
  "project_stage",
  "task_type",
  "marketplace_order",
  "distribution_submission",
  "qa_review",
  "support_case",
] as const;
export type SlaScopeType = (typeof SLA_SCOPE_TYPES)[number];

export const SLA_TRACKER_STATUSES = [
  "active",
  "completed",
  "breached",
  "cancelled",
] as const;
export type SlaTrackerStatus = (typeof SLA_TRACKER_STATUSES)[number];

export const SLA_BREACH_LEVELS = ["none", "warning", "critical"] as const;
export type SlaBreachLevel = (typeof SLA_BREACH_LEVELS)[number];

export const LEDGER_DIRECTIONS = ["income", "expense"] as const;
export type LedgerDirection = (typeof LEDGER_DIRECTIONS)[number];

export const LEDGER_ENTRY_TYPES = [
  "project_sale",
  "marketplace_purchase",
  "contractor_payout",
  "refund",
  "distribution_cost",
  "design_cost",
  "editing_cost",
  "qa_cost",
  "platform_fee",
  "manual_adjustment",
  "other",
] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const ALERT_SEVERITIES = [
  "info",
  "warning",
  "error",
  "critical",
] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_STATUSES = [
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const KPI_SCOPE_TYPES = [
  "global",
  "department",
  "staff",
  "project",
] as const;
export type KpiScopeType = (typeof KPI_SCOPE_TYPES)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialDepartment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface EditorialStaffProfile {
  id: string;
  user_id: string;
  department_id: string | null;
  display_name: string;
  role_title: string | null;
  active: boolean;
  capacity_points: number;
  timezone: string | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialProjectAssignment {
  id: string;
  project_id: string;
  staff_profile_id: string;
  assignment_role: AssignmentRole;
  allocation_percent: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

export interface EditorialOperationalTask {
  id: string;
  project_id: string | null;
  assignment_id: string | null;
  created_by: string | null;
  owner_user_id: string | null;
  task_type: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  department_id: string | null;
  due_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface EditorialSlaPolicy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope_type: SlaScopeType;
  target_hours: number;
  warning_threshold_percent: number;
  critical_threshold_percent: number;
  active: boolean;
  created_at: string;
}

export interface EditorialSlaTracker {
  id: string;
  sla_policy_id: string;
  project_id: string | null;
  task_id: string | null;
  order_id: string | null;
  submission_id: string | null;
  starts_at: string;
  due_at: string;
  completed_at: string | null;
  status: SlaTrackerStatus;
  breach_level: SlaBreachLevel;
  created_at: string;
  updated_at: string;
}

export interface EditorialWorkloadSnapshot {
  id: string;
  staff_profile_id: string;
  snapshot_date: string;
  active_assignments_count: number;
  open_tasks_count: number;
  in_progress_tasks_count: number;
  urgent_tasks_count: number;
  allocated_percent_total: number;
  capacity_points: number;
  utilization_percent: number;
  created_at: string;
}

export interface EditorialFinancialLedgerEntry {
  id: string;
  project_id: string | null;
  order_id: string | null;
  entry_type: LedgerEntryType;
  category: string;
  amount: number;
  currency: string;
  direction: LedgerDirection;
  reference_code: string | null;
  notes: string | null;
  recorded_by: string | null;
  entry_date: string;
  created_at: string;
}

export interface EditorialAlert {
  id: string;
  project_id: string | null;
  task_id: string | null;
  order_id: string | null;
  submission_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  status: AlertStatus;
  assigned_user_id: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  payload: Json | null;
  created_at: string;
}

export interface EditorialKpiSnapshot {
  id: string;
  snapshot_date: string;
  scope_type: KpiScopeType;
  scope_id: string | null;
  total_active_projects: number;
  total_overdue_tasks: number;
  total_sla_breaches: number;
  total_open_alerts: number;
  total_marketplace_orders: number;
  total_distribution_submissions: number;
  gross_income: number;
  gross_expense: number;
  net_value: number;
  created_at: string;
}

export interface EditorialOsEvent {
  id: string;
  project_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  payload: Json | null;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateStaffProfileInput = Pick<
  EditorialStaffProfile,
  "user_id" | "display_name"
> &
  Partial<
    Pick<
      EditorialStaffProfile,
      "department_id" | "role_title" | "capacity_points" | "timezone" | "skills"
    >
  >;

export type CreateProjectAssignmentInput = Pick<
  EditorialProjectAssignment,
  "project_id" | "staff_profile_id" | "assignment_role"
> &
  Partial<
    Pick<
      EditorialProjectAssignment,
      "allocation_percent" | "starts_at" | "ends_at"
    >
  >;

export type CreateOperationalTaskInput = Pick<
  EditorialOperationalTask,
  "task_type" | "title"
> &
  Partial<
    Pick<
      EditorialOperationalTask,
      | "project_id"
      | "assignment_id"
      | "owner_user_id"
      | "description"
      | "priority"
      | "department_id"
      | "due_at"
      | "metadata"
    >
  >;

export type CreateLedgerEntryInput = Pick<
  EditorialFinancialLedgerEntry,
  "entry_type" | "category" | "amount" | "direction" | "entry_date"
> &
  Partial<
    Pick<
      EditorialFinancialLedgerEntry,
      "project_id" | "order_id" | "currency" | "reference_code" | "notes"
    >
  >;

export type CreateAlertInput = Pick<
  EditorialAlert,
  "alert_type" | "severity" | "title"
> &
  Partial<
    Pick<
      EditorialAlert,
      | "project_id"
      | "task_id"
      | "order_id"
      | "submission_id"
      | "message"
      | "assigned_user_id"
      | "payload"
    >
  >;

// ── View models ───────────────────────────────────────────────────────────────

/** Staff profile enriched with department info and current workload. */
export interface StaffProfileWithWorkload extends EditorialStaffProfile {
  department: Pick<EditorialDepartment, "id" | "code" | "name"> | null;
  latest_snapshot: EditorialWorkloadSnapshot | null;
}

/** Project assignments enriched with staff profile info. */
export interface ProjectAssignmentWithStaff extends EditorialProjectAssignment {
  staff: Pick<
    EditorialStaffProfile,
    "id" | "display_name" | "role_title" | "department_id"
  >;
}

/** SLA tracker enriched with the policy definition and computed time metrics. */
export interface SlaTrackerWithPolicy extends EditorialSlaTracker {
  policy: Pick<
    EditorialSlaPolicy,
    | "id"
    | "code"
    | "name"
    | "scope_type"
    | "target_hours"
    | "warning_threshold_percent"
    | "critical_threshold_percent"
  >;
  elapsed_hours: number;
  remaining_hours: number;
  percent_elapsed: number;
}

/** Financial summary for a project. */
export interface ProjectFinancialSummary {
  project_id: string;
  gross_income: number;
  gross_expense: number;
  net_value: number;
  currency: string;
  entries_count: number;
}

// =============================================================================
// Phase 11 — CRM / Sales Pipeline Editorial
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const CRM_ORGANIZATION_TYPES = [
  "client",
  "ministry",
  "school",
  "university",
  "church",
  "nonprofit",
  "business",
  "agency",
  "partner",
  "vendor",
  "other",
] as const;
export type CrmOrganizationType = (typeof CRM_ORGANIZATION_TYPES)[number];

export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
  "archived",
] as const;
export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];

export const CRM_PIPELINE_STAGES = [
  "discovery",
  "qualification",
  "proposal",
  "negotiation",
  "verbal_commitment",
  "won",
  "lost",
] as const;
export type CrmPipelineStage = (typeof CRM_PIPELINE_STAGES)[number];

export const CRM_OPPORTUNITY_STATUSES = [
  "open",
  "won",
  "lost",
  "stalled",
  "cancelled",
] as const;
export type CrmOpportunityStatus = (typeof CRM_OPPORTUNITY_STATUSES)[number];

export const CRM_PACKAGE_TYPES = [
  "editing",
  "design",
  "formatting",
  "distribution",
  "full_publishing",
  "coaching",
  "consulting",
  "marketing",
  "custom",
] as const;
export type CrmPackageType = (typeof CRM_PACKAGE_TYPES)[number];

export const CRM_QUOTE_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
] as const;
export type CrmQuoteStatus = (typeof CRM_QUOTE_STATUSES)[number];

export const CRM_QUOTE_ITEM_TYPES = [
  "service",
  "discount",
  "fee",
  "custom",
] as const;
export type CrmQuoteItemType = (typeof CRM_QUOTE_ITEM_TYPES)[number];

export const CRM_ACTIVITY_TYPES = [
  "note",
  "call",
  "email",
  "meeting",
  "whatsapp",
  "task",
  "proposal_sent",
  "proposal_viewed",
  "follow_up",
  "status_change",
  "other",
] as const;
export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

export const CRM_FOLLOWUP_STATUSES = [
  "open",
  "completed",
  "cancelled",
  "overdue",
] as const;
export type CrmFollowupStatus = (typeof CRM_FOLLOWUP_STATUSES)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialCrmOrganization {
  id: string;
  name: string;
  legal_name: string | null;
  organization_type: CrmOrganizationType;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmContact {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  preferred_language: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmLead {
  id: string;
  source: string;
  organization_id: string | null;
  contact_id: string | null;
  lead_status: CrmLeadStatus;
  lead_score: number;
  interest_type: string | null;
  service_interest: string[] | null;
  budget_range: string | null;
  timeline_expectation: string | null;
  owner_user_id: string | null;
  captured_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmOpportunity {
  id: string;
  organization_id: string | null;
  primary_contact_id: string | null;
  lead_id: string | null;
  title: string;
  description: string | null;
  pipeline_stage: CrmPipelineStage;
  status: CrmOpportunityStatus;
  estimated_value: number;
  currency: string;
  probability_percent: number;
  expected_close_date: string | null;
  owner_user_id: string | null;
  created_by: string | null;
  won_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmServicePackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  package_type: CrmPackageType;
  base_price: number;
  currency: string;
  active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmQuote {
  id: string;
  opportunity_id: string;
  quote_number: string;
  title: string;
  description: string | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: CrmQuoteStatus;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmQuoteItem {
  id: string;
  quote_id: string;
  package_id: string | null;
  item_type: CrmQuoteItemType;
  title: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface EditorialCrmActivity {
  id: string;
  organization_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  opportunity_id: string | null;
  quote_id: string | null;
  activity_type: CrmActivityType;
  subject: string;
  description: string | null;
  performed_by: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  outcome: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface EditorialCrmFollowup {
  id: string;
  opportunity_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  due_at: string;
  status: CrmFollowupStatus;
  priority: TaskPriority;
  assigned_user_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialCrmStageHistory {
  id: string;
  opportunity_id: string;
  old_stage: string | null;
  new_stage: string;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

export interface EditorialCrmProjectConversion {
  id: string;
  opportunity_id: string;
  project_id: string;
  converted_by: string | null;
  conversion_notes: string | null;
  created_at: string;
}

export interface EditorialCrmPipelineSnapshot {
  id: string;
  snapshot_date: string;
  owner_user_id: string | null;
  total_open_opportunities: number;
  total_won_opportunities: number;
  total_lost_opportunities: number;
  pipeline_value: number;
  weighted_pipeline_value: number;
  quotes_sent_count: number;
  quotes_accepted_count: number;
  conversion_count: number;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateCrmOrganizationInput = Pick<
  EditorialCrmOrganization,
  "name" | "organization_type"
> &
  Partial<
    Pick<
      EditorialCrmOrganization,
      | "legal_name"
      | "website_url"
      | "email"
      | "phone"
      | "country"
      | "city"
      | "notes"
      | "owner_user_id"
    >
  >;

export type CreateCrmContactInput = Pick<EditorialCrmContact, "first_name"> &
  Partial<
    Pick<
      EditorialCrmContact,
      | "organization_id"
      | "last_name"
      | "display_name"
      | "email"
      | "phone"
      | "job_title"
      | "preferred_language"
      | "country"
      | "city"
      | "notes"
      | "owner_user_id"
    >
  >;

export type CreateCrmLeadInput = Pick<EditorialCrmLead, "source"> &
  Partial<
    Pick<
      EditorialCrmLead,
      | "organization_id"
      | "contact_id"
      | "lead_score"
      | "interest_type"
      | "service_interest"
      | "budget_range"
      | "timeline_expectation"
      | "owner_user_id"
      | "notes"
    >
  >;

export type CreateCrmOpportunityInput = Pick<
  EditorialCrmOpportunity,
  "title"
> &
  Partial<
    Pick<
      EditorialCrmOpportunity,
      | "organization_id"
      | "primary_contact_id"
      | "lead_id"
      | "description"
      | "pipeline_stage"
      | "estimated_value"
      | "currency"
      | "probability_percent"
      | "expected_close_date"
      | "owner_user_id"
    >
  >;

export type CreateCrmQuoteInput = Pick<
  EditorialCrmQuote,
  "opportunity_id" | "quote_number" | "title"
> &
  Partial<
    Pick<
      EditorialCrmQuote,
      | "description"
      | "subtotal_amount"
      | "discount_amount"
      | "tax_amount"
      | "total_amount"
      | "currency"
      | "valid_until"
    >
  >;

// ── View models ───────────────────────────────────────────────────────────────

/** Opportunity enriched with org, contact, and latest quote info. */
export interface CrmOpportunityWithDetails extends EditorialCrmOpportunity {
  organization: Pick<EditorialCrmOrganization, "id" | "name" | "organization_type"> | null;
  primary_contact: Pick<EditorialCrmContact, "id" | "first_name" | "last_name" | "email"> | null;
  latest_quote: Pick<EditorialCrmQuote, "id" | "quote_number" | "total_amount" | "status"> | null;
  open_followups_count: number;
  weighted_value: number;
}

/** Quote enriched with its line items and related opportunity context. */
export interface CrmQuoteWithItems extends EditorialCrmQuote {
  items: EditorialCrmQuoteItem[];
  opportunity: Pick<EditorialCrmOpportunity, "id" | "title" | "pipeline_stage">;
}

/** Lead enriched with contact and organization info. */
export interface CrmLeadWithContext extends EditorialCrmLead {
  organization: Pick<EditorialCrmOrganization, "id" | "name"> | null;
  contact: Pick<EditorialCrmContact, "id" | "first_name" | "last_name" | "email"> | null;
}

// =============================================================================
// Phase 12 — Client Billing, Contracts & Renewals
// =============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export const CONTRACT_TYPES = [
  "publishing",
  "editing",
  "design",
  "distribution",
  "service_agreement",
  "nda",
  "consulting",
  "custom",
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = [
  "draft",
  "sent",
  "under_review",
  "signed",
  "active",
  "expired",
  "terminated",
  "cancelled",
  "renewed",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_VERSION_STATUSES = [
  "draft",
  "sent",
  "signed",
  "superseded",
  "cancelled",
] as const;
export type ContractVersionStatus = (typeof CONTRACT_VERSION_STATUSES)[number];

export const SIGNER_TYPES = [
  "client",
  "internal",
  "witness",
  "legal",
  "other",
] as const;
export type SignerType = (typeof SIGNER_TYPES)[number];

export const SIGNATURE_STATUSES = [
  "pending",
  "sent",
  "viewed",
  "signed",
  "declined",
  "expired",
  "revoked",
] as const;
export type SignatureStatus = (typeof SIGNATURE_STATUSES)[number];

export const INVOICE_TYPES = [
  "standard",
  "deposit",
  "milestone",
  "recurring",
  "final",
  "adjustment",
  "refund",
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "cancelled",
  "refunded",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_ITEM_TYPES = [
  "service",
  "discount",
  "fee",
  "tax",
  "adjustment",
  "refund",
  "custom",
] as const;
export type InvoiceItemType = (typeof INVOICE_ITEM_TYPES)[number];

export const PAYMENT_SCHEDULE_TYPES = [
  "deposit",
  "milestone",
  "recurring",
  "final_balance",
  "renewal",
  "manual",
] as const;
export type PaymentScheduleType = (typeof PAYMENT_SCHEDULE_TYPES)[number];

export const PAYMENT_SCHEDULE_STATUSES = [
  "scheduled",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type PaymentScheduleStatus =
  (typeof PAYMENT_SCHEDULE_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "credit_card",
  "debit_card",
  "stripe",
  "paypal",
  "check",
  "wire",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const RECEIVED_PAYMENT_STATUSES = [
  "received",
  "pending",
  "allocated",
  "partially_allocated",
  "failed",
  "reversed",
  "refunded",
] as const;
export type ReceivedPaymentStatus =
  (typeof RECEIVED_PAYMENT_STATUSES)[number];

export const RENEWAL_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "renewed",
  "declined",
  "expired",
  "cancelled",
] as const;
export type RenewalStatus = (typeof RENEWAL_STATUSES)[number];

export const RENEWAL_TYPES = [
  "manual",
  "auto",
  "upsell",
  "extension",
  "renegotiation",
] as const;
export type RenewalType = (typeof RENEWAL_TYPES)[number];

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface EditorialClientAccount {
  id: string;
  organization_id: string | null;
  primary_contact_id: string | null;
  account_code: string;
  display_name: string;
  legal_name: string | null;
  tax_id: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_country: string | null;
  billing_state: string | null;
  billing_city: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  postal_code: string | null;
  preferred_currency: string;
  payment_terms_days: number;
  active: boolean;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialContractTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  contract_type: ContractType;
  template_body: string;
  default_currency: string;
  active: boolean;
  version_label: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialClientContract {
  id: string;
  client_account_id: string;
  project_id: string | null;
  opportunity_id: string | null;
  quote_id: string | null;
  template_id: string | null;
  contract_number: string;
  title: string;
  contract_type: ContractType;
  status: ContractStatus;
  currency: string;
  contract_value: number;
  effective_date: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  termination_date: string | null;
  auto_renew: boolean;
  renewal_term_months: number | null;
  signed_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  version_label: string | null;
  document_file_id: string | null;
  body_text: string | null;
  change_summary: string | null;
  status: ContractVersionStatus;
  created_by: string | null;
  created_at: string;
}

export interface EditorialContractSignature {
  id: string;
  contract_id: string;
  contract_version_id: string | null;
  signer_name: string;
  signer_email: string | null;
  signer_role: string | null;
  signer_type: SignerType;
  signature_status: SignatureStatus;
  signed_at: string | null;
  signature_provider: string | null;
  signature_reference: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialInvoice {
  id: string;
  client_account_id: string;
  contract_id: string | null;
  project_id: string | null;
  quote_id: string | null;
  invoice_number: string;
  title: string;
  description: string | null;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  voided_at: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_by: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialInvoiceItem {
  id: string;
  invoice_id: string;
  item_type: InvoiceItemType;
  title: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface EditorialPaymentSchedule {
  id: string;
  client_account_id: string;
  contract_id: string | null;
  invoice_id: string | null;
  project_id: string | null;
  schedule_type: PaymentScheduleType;
  status: PaymentScheduleStatus;
  title: string;
  description: string | null;
  due_date: string;
  expected_amount: number;
  currency: string;
  paid_amount: number;
  remaining_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialReceivedPayment {
  id: string;
  client_account_id: string;
  payment_reference: string | null;
  payment_method: PaymentMethod;
  payment_provider: string | null;
  provider_transaction_id: string | null;
  status: ReceivedPaymentStatus;
  amount: number;
  currency: string;
  received_at: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface EditorialPaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string | null;
  payment_schedule_id: string | null;
  project_id: string | null;
  allocated_amount: number;
  allocated_at: string;
  allocated_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface EditorialContractRenewal {
  id: string;
  contract_id: string;
  previous_contract_id: string | null;
  renewal_status: RenewalStatus;
  renewal_type: RenewalType;
  proposed_start_date: string | null;
  proposed_end_date: string | null;
  proposed_value: number | null;
  currency: string;
  renewed_contract_id: string | null;
  notes: string | null;
  managed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialBillingEvent {
  id: string;
  client_account_id: string | null;
  contract_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  renewal_id: string | null;
  event_type: string;
  actor_user_id: string | null;
  summary: string;
  payload: Json | null;
  created_at: string;
}

export interface EditorialBillingSnapshot {
  id: string;
  snapshot_date: string;
  client_account_id: string | null;
  total_contract_value: number;
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  overdue_invoices_count: number;
  active_contracts_count: number;
  pending_renewals_count: number;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateClientAccountInput = Pick<
  EditorialClientAccount,
  "account_code" | "display_name"
> &
  Partial<
    Pick<
      EditorialClientAccount,
      | "organization_id"
      | "primary_contact_id"
      | "legal_name"
      | "tax_id"
      | "billing_email"
      | "billing_phone"
      | "billing_country"
      | "billing_city"
      | "preferred_currency"
      | "payment_terms_days"
      | "owner_user_id"
    >
  >;

export type CreateClientContractInput = Pick<
  EditorialClientContract,
  "client_account_id" | "contract_number" | "title" | "contract_type"
> &
  Partial<
    Pick<
      EditorialClientContract,
      | "project_id"
      | "opportunity_id"
      | "quote_id"
      | "template_id"
      | "currency"
      | "contract_value"
      | "start_date"
      | "end_date"
      | "auto_renew"
      | "renewal_term_months"
      | "owner_user_id"
    >
  >;

export type CreateInvoiceInput = Pick<
  EditorialInvoice,
  "client_account_id" | "invoice_number" | "title" | "invoice_type" | "issue_date"
> &
  Partial<
    Pick<
      EditorialInvoice,
      | "contract_id"
      | "project_id"
      | "quote_id"
      | "description"
      | "currency"
      | "due_date"
      | "billing_period_start"
      | "billing_period_end"
      | "owner_user_id"
    >
  >;

export type RecordPaymentInput = Pick<
  EditorialReceivedPayment,
  "client_account_id" | "payment_method" | "amount"
> &
  Partial<
    Pick<
      EditorialReceivedPayment,
      | "payment_reference"
      | "payment_provider"
      | "provider_transaction_id"
      | "currency"
      | "received_at"
      | "notes"
    >
  >;

// ── View models ───────────────────────────────────────────────────────────────

/** Contract enriched with signer status and latest version info. */
export interface ClientContractWithStatus extends EditorialClientContract {
  latest_version: Pick<
    EditorialContractVersion,
    "id" | "version_number" | "status"
  > | null;
  pending_signatures_count: number;
  total_signatures_count: number;
  active_renewal: Pick<
    EditorialContractRenewal,
    "id" | "renewal_status" | "renewal_type"
  > | null;
}

/** Invoice enriched with line items and allocation summary. */
export interface InvoiceWithItems extends EditorialInvoice {
  items: EditorialInvoiceItem[];
  allocations_count: number;
}

/** Client account financial summary for the billing dashboard. */
export interface ClientAccountBillingSummary {
  account: EditorialClientAccount;
  total_contract_value: number;
  total_invoiced: number;
  total_collected: number;
  balance_due: number;
  overdue_invoices_count: number;
  pending_renewals_count: number;
  last_payment_at: string | null;
}
