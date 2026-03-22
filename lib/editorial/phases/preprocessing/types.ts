import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export type SupportedPreprocessingMimeType =
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/pdf"
  | "text/plain"
  | "application/octet-stream";

export type NormalizedBlockKind = "heading" | "paragraph" | "blank";

export interface EditorialPreprocessingInput {
  projectId: string;
}

export interface DetectedLanguage {
  code: string;
  confidence: number;
  source: "detected" | "declared_fallback";
}

export interface NormalizedManuscriptBlock {
  id: string;
  kind: NormalizedBlockKind;
  text: string;
  line_start: number;
  line_end: number;
  heading_level: number | null;
}

export interface NormalizedManuscriptChapter {
  id: string;
  title: string;
  heading_block_id: string | null;
  start_block_index: number;
  end_block_index: number;
  start_line: number;
  end_line: number;
}

export interface NormalizedManuscriptStats {
  character_count: number;
  word_count: number;
  line_count: number;
  paragraph_count: number;
  heading_count: number;
  chapter_count: number;
}

export interface NormalizedManuscriptDocument {
  schema_version: 1;
  project_id: string;
  source_asset_id: string;
  source_file_name: string;
  mime_type: string;
  declared_language: string;
  detected_language: DetectedLanguage;
  raw_text: string;
  normalized_text: string;
  stats: NormalizedManuscriptStats;
  headings: NormalizedManuscriptBlock[];
  chapters: NormalizedManuscriptChapter[];
  blocks: NormalizedManuscriptBlock[];
  normalized_at: string;
}

export interface EditorialPreprocessingResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  sourceAssetId: string;
  normalizedAssetId: string;
  extractedTextUri: string;
  normalizedAssetUri: string;
  detectedLanguage: DetectedLanguage;
  stats: NormalizedManuscriptStats;
  transitioned: boolean;
}
