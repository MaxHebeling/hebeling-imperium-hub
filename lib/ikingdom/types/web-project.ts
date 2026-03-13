// ── Web Project Pipeline Types ──────────────────────────────────────

export type WebStageKey =
  | "briefing"
  | "diseno"
  | "desarrollo"
  | "contenido"
  | "revision"
  | "testing"
  | "lanzamiento"
  | "soporte";

export type WebStageStatus =
  | "pending"
  | "queued"
  | "processing"
  | "review_required"
  | "approved"
  | "failed"
  | "completed";

export type WebProjectStatus = "draft" | "in_progress" | "review" | "completed" | "on_hold" | "cancelled";

export type WebServiceType =
  | "landing_page"
  | "sitio_corporativo"
  | "ecommerce"
  | "blog"
  | "webapp"
  | "rediseno"
  | "mantenimiento";

export interface WebProject {
  id: string;
  org_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  client_name: string | null;
  domain: string | null;
  service_type: WebServiceType | null;
  current_stage: WebStageKey;
  status: WebProjectStatus;
  progress_percent: number;
  tech_stack: string | null;
  budget: number | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface WebStage {
  id: string;
  project_id: string;
  stage_key: WebStageKey;
  status: WebStageStatus;
  started_at: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface WebFile {
  id: string;
  project_id: string;
  stage_key: WebStageKey | null;
  file_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface WebDeliverable {
  id: string;
  project_id: string;
  deliverable_type: string;
  title: string;
  url: string | null;
  status: string;
  version: number;
  created_at: string;
}
