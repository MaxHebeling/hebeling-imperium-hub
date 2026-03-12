import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

export type EditorialAiFindingType = "issue" | "recommendation" | "flag";
export type EditorialAiFindingSeverity = "info" | "warning" | "critical";
export type EditorialAiFindingStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export interface EditorialAiFindingReference {
  file_id?: string;
  file_version?: number;
  chapter?: string;
  paragraph_index?: number;
  start?: number;
  end?: number;
  [key: string]: unknown;
}

export interface EditorialAiFinding {
  id: string;
  org_id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  ai_job_id: string;
  source_file_id: string | null;

  finding_type: EditorialAiFindingType | string;
  severity: EditorialAiFindingSeverity | string;
  status: EditorialAiFindingStatus | string;

  title: string;
  description: string;
  snippet: string | null;
  reference: EditorialAiFindingReference | null;
  suggested_action: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

