export type EditorialFileVisibility = "internal" | "client" | "public";

export type EditorialStageKey =
  | "ingesta"
  | "estructura"
  | "estilo"
  | "ortotipografia"
  | "maquetacion"
  | "revision_final";

export type EditorialStageStatus =
  | "pending"
  | "queued"
  | "processing"
  | "review_required"
  | "approved"
  | "failed"
  | "completed";

export interface EditorialProject {
  id: string;
  org_id: string;
  client_id: string | null;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  language: string;
  genre: string | null;
  target_audience: string | null;
  word_count: number | null;
  page_estimate: number | null;
  current_stage: EditorialStageKey;
  status: string;
  progress_percent: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EditorialStage {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  status: EditorialStageStatus;
  started_at: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  retry_count: number;
  notes: string | null;
  created_at: string;
}

export interface EditorialFile {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  file_type: string;
  version: number;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  visibility: EditorialFileVisibility;
  created_at: string;
}

export interface EditorialJob {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  job_type: string;
  provider: string | null;
  status: string;
  input_ref: string | null;
  output_ref: string | null;
  error_log: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface EditorialComment {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  author_type: string | null;
  author_id: string | null;
  comment: string;
  visibility: string;
  created_at: string;
}

export interface EditorialExport {
  id: string;
  project_id: string;
  export_type: string;
  version: number;
  storage_path: string;
  status: string;
  checksum: string | null;
  created_at: string;
}
