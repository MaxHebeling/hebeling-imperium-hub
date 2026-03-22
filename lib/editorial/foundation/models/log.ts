import type { EditorialWorkflowState } from "./workflow";

export type PipelineLogLevel = "debug" | "info" | "warning" | "error";

export interface PipelineLog {
  id: string;
  project_id: string;
  workflow_id: string | null;
  stage_id: string | null;
  stage_key: EditorialWorkflowState | null;
  event_type: string;
  level: PipelineLogLevel;
  message: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface PipelineLogDraft {
  stage_key?: EditorialWorkflowState | null;
  stage_id?: string | null;
  event_type: string;
  level: PipelineLogLevel;
  message: string;
  payload?: Record<string, unknown> | null;
}
