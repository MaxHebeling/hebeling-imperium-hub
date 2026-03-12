import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

export type EditorialAiTaskKey =
  | "manuscript_analysis"
  | "structure_analysis"
  | "style_suggestions"
  | "orthotypography_review"
  | "issue_detection"
  | "quality_scoring"
  | "redline_diff"
  | "layout_analysis"
  | "typography_check"
  | "page_flow_review"
  | "export_validation"
  | "metadata_generation";

export type EditorialAiJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface EditorialAiPromptTemplate {
  id: string;
  org_id: string;
  stage_key: EditorialStageKey;
  task_key: EditorialAiTaskKey | string;
  version: number;
  prompt_text: string;
  output_schema: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialAiJobContext {
  project_id: string;
  stage_key: EditorialStageKey | null;
  source_file_id: string | null;
  source_file_version: number | null;
  requested_by: string;
  prompt_template_id?: string | null;
  prompt_template_version?: number | null;
}

