// =============================================================================
// Editorial — TypeScript Types
// Reino Editorial AI Engine · Phases 4A, 4B, 5, 6, 7 & 8
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
