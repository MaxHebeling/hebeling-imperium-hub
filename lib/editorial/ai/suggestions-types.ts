import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

export type AiSuggestionSeverity = "baja" | "media" | "alta";

export type AiSuggestionKind =
  | "estructura"
  | "estilo"
  | "gramatica"
  | "doctrina"
  | "formato"
  | "otro";

export interface AiTextLocation {
  chapter?: number | null;
  section_id?: string | null;
  paragraph_index?: number | null;
  sentence_index?: number | null;
  offset_start?: number | null;
  offset_end?: number | null;
}

export interface AiTextSuggestion {
  id: string;
  job_id: string;
  project_id: string;
  file_id: string;
  file_version: number;
  task_key: EditorialAiTaskKey | string;
  kind: AiSuggestionKind;
  severity: AiSuggestionSeverity;
  confidence: number; // 0–1
  location: AiTextLocation;
  original_text: string;
  suggested_text: string;
  justification: string;
  applied: boolean;
  applied_at: string | null;
  validated_by: string | null;
  created_at: string;
}

