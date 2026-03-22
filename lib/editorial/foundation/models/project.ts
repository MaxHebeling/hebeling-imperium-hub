import type { EditorialWorkflowState } from "./workflow";

export type ManuscriptSourceType = "upload" | "import" | "external";

export interface EditorialMetadata {
  id: string;
  project_id: string;
  author: string;
  title: string;
  subtitle: string | null;
  language: string;
  genre: string;
  synopsis: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ManuscriptAsset {
  id: string;
  project_id: string;
  source_type: ManuscriptSourceType;
  source_label: string;
  source_uri: string | null;
  original_file_name: string;
  mime_type: string;
  checksum: string | null;
  size_bytes: number | null;
  extracted_text_uri: string | null;
  version: number;
  uploaded_at: string;
}

export interface EditorialProject {
  id: string;
  author: string;
  title: string;
  manuscript_source: ManuscriptSourceType;
  language: string;
  genre: string;
  current_status: EditorialWorkflowState;
  metadata: EditorialMetadata;
  manuscript_asset: ManuscriptAsset;
  workflow_id: string;
  created_at: string;
  updated_at: string;
}

export interface EditorialProjectInitializationInput {
  author: string;
  title: string;
  manuscriptSource: ManuscriptSourceType;
  originalFileName: string;
  mimeType: string;
  language: string;
  genre: string;
  sizeBytes?: number | null;
  subtitle?: string | null;
  synopsis?: string | null;
  tags?: string[];
  sourceLabel?: string;
  sourceUri?: string | null;
  checksum?: string | null;
}
