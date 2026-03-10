// ─── Editorial Stage Keys ─────────────────────────────────────────────────────

export type EditorialStageKey =
  | "ingesta"
  | "estructura"
  | "estilo"
  | "ortotipografia"
  | "maquetacion"
  | "revision_final";

export const EDITORIAL_STAGES: EditorialStageKey[] = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
];

// ─── AI Job ──────────────────────────────────────────────────────────────────

export type AiJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface AiJob {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  job_type: string;
  status: AiJobStatus;
  triggered_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AiJobPayload {
  project_id: string;
  stage_key: EditorialStageKey;
  job_type: string;
  triggered_by?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ─── AI Job Run ───────────────────────────────────────────────────────────────

export type AiJobRunStatus = "started" | "success" | "failure";

export interface AiJobRun {
  id: string;
  job_id: string;
  status: AiJobRunStatus;
  started_at: string;
  finished_at: string | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
}

export interface AiJobRunPayload {
  job_id: string;
}

// ─── AI Finding ───────────────────────────────────────────────────────────────

export type AiFindingType =
  | "grammar"
  | "style"
  | "structure"
  | "consistency"
  | "terminology"
  | "other";

export type AiFindingSeverity = "critical" | "major" | "minor" | "suggestion";

export type AiFindingStatus = "open" | "accepted" | "rejected" | "resolved";

export interface AiFinding {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  ai_job_id: string;
  source_file_id: string | null;
  finding_type: AiFindingType;
  severity: AiFindingSeverity;
  title: string;
  description: string;
  snippet: string | null;
  suggested_action: string;
  status: AiFindingStatus;
  created_at: string;
  updated_at: string;
}

export interface AiFindingPayload {
  project_id: string;
  stage_key: EditorialStageKey;
  ai_job_id: string;
  source_file_id?: string | null;
  finding_type: AiFindingType;
  severity: AiFindingSeverity;
  title: string;
  description: string;
  snippet?: string | null;
  suggested_action: string;
  status?: AiFindingStatus;
}

export interface AiFindingPatch {
  status?: AiFindingStatus;
  title?: string;
  description?: string;
  suggested_action?: string;
}

export interface AiFindingFilters {
  project_id: string;
  stage_key?: EditorialStageKey;
  status?: AiFindingStatus;
  severity?: AiFindingSeverity;
}

// ─── AI Recommendation ────────────────────────────────────────────────────────

export interface AiRecommendation {
  id: string;
  finding_id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  content: string;
  rationale: string | null;
  priority: number;
  created_at: string;
}

export interface AiRecommendationPayload {
  finding_id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  content: string;
  rationale?: string | null;
  priority?: number;
}

// ─── AI Review Action ─────────────────────────────────────────────────────────

export type AiReviewActionType =
  | "approve"
  | "reject"
  | "request_revision"
  | "escalate";

export interface AiReviewAction {
  id: string;
  finding_id: string;
  reviewer_id: string;
  action_type: AiReviewActionType;
  note: string | null;
  created_at: string;
}

export interface AiReviewActionPayload {
  finding_id: string;
  reviewer_id: string;
  action_type: AiReviewActionType;
  note?: string | null;
}
