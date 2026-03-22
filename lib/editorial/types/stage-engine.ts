export type EditorialWorkflowStageKey =
  | "ingesta"
  | "diagnostico_editorial"
  | "edicion_estructural"
  | "edicion_linea"
  | "copyediting_ortotipografia"
  | "cierre_texto"
  | "diseno_interior"
  | "portada"
  | "prueba_final"
  | "publicacion"
  | "postpublicacion";

export type EditorialWorkflowStageStatus =
  | "ready"
  | "ai_processing"
  | "human_review"
  | "changes_requested"
  | "approved"
  | "locked"
  | "failed";

export type EditorialProjectStatusV2 =
  | "draft"
  | "active"
  | "blocked"
  | "in_review"
  | "ready_for_publication"
  | "published"
  | "archived";

export type EditorialArtifactRole =
  | "manuscript_original"
  | "editorial_diagnosis"
  | "editorial_working"
  | "master_text"
  | "interior_pdf"
  | "cover_concept"
  | "cover_final"
  | "proof_pack"
  | "distribution_asset";

export type EditorialFindingType =
  | "editorial"
  | "structural"
  | "style"
  | "grammar"
  | "layout"
  | "metadata"
  | "production"
  | "commercial";

export type EditorialFindingSeverityV2 = "info" | "warning" | "critical";

export type EditorialFindingStatusV2 =
  | "open"
  | "accepted"
  | "rejected"
  | "resolved"
  | "waived";

export type EditorialApprovalType =
  | "stage_gate"
  | "content_approval"
  | "design_approval"
  | "production_approval"
  | "publication_approval";

export type EditorialApprovalDecision = "approved" | "changes_requested" | "rejected";

export interface EditorialWorkflowStageDefinition {
  key: EditorialWorkflowStageKey;
  name: string;
  order: number;
  description: string;
  requiresHumanApproval: boolean;
  allowsAi: boolean;
  allowsFileOutput: boolean;
  requiredArtifactRoles: EditorialArtifactRole[];
}

export interface EditorialStageRun {
  id: string;
  project_id: string;
  stage_key: EditorialWorkflowStageKey;
  status: EditorialWorkflowStageStatus;
  sequence_number: number;
  owner_user_id: string | null;
  reviewer_user_id: string | null;
  approver_user_id: string | null;
  input_version_id: string | null;
  output_version_id: string | null;
  ai_summary: string | null;
  quality_score: number | null;
  started_at: string | null;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  reopened_from_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialFileVersion {
  id: string;
  project_id: string;
  stage_run_id: string | null;
  source_version_id: string | null;
  file_role: EditorialArtifactRole;
  version_number: number;
  label: string | null;
  storage_path: string;
  preview_path: string | null;
  mime_type: string | null;
  checksum: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
  is_locked: boolean;
}

export interface EditorialFindingV2 {
  id: string;
  project_id: string;
  stage_run_id: string | null;
  file_version_id: string | null;
  job_id: string | null;
  finding_type: EditorialFindingType;
  severity: EditorialFindingSeverityV2;
  location_ref: Record<string, unknown> | null;
  title: string;
  description: string;
  suggestion: string | null;
  evidence_ref: Record<string, unknown> | null;
  status: EditorialFindingStatusV2;
  created_at: string;
  updated_at: string;
}

export interface EditorialApproval {
  id: string;
  project_id: string;
  stage_run_id: string;
  approval_type: EditorialApprovalType;
  decision: EditorialApprovalDecision;
  notes: string | null;
  approved_by: string | null;
  approved_at: string;
}
