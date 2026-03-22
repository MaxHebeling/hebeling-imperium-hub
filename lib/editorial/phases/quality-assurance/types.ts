import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export interface EditorialQualityAssuranceInput {
  projectId: string;
}

export type EditorialQaSeverity = "critical" | "warning" | "info";
export type EditorialQaCategory = "file" | "format" | "missing_elements";

export interface EditorialQaIssue {
  id: string;
  severity: EditorialQaSeverity;
  category: EditorialQaCategory;
  title: string;
  message: string;
  file_format: "pdf" | "epub" | "package" | "general";
  auto_fixable: boolean;
}

export interface EditorialQaCheck {
  id: string;
  label: string;
  category: EditorialQaCategory;
  status: "passed" | "failed" | "warning";
  file_format: "pdf" | "epub" | "package" | "general";
  details: string;
}

export interface EditorialApprovedPackage {
  schema_version: 1;
  project_id: string;
  layout_asset_id: string;
  validated_asset_id: string;
  metadata_asset_id: string;
  cover_asset_id: string | null;
  pdf_storage_path: string;
  epub_storage_path: string;
  checks: EditorialQaCheck[];
  issues: EditorialQaIssue[];
  summary: string;
  approved: boolean;
  generated_at: string;
}

export interface EditorialQualityAssuranceResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  layoutAssetId: string;
  qaAssetId: string;
  qaAssetUri: string;
  approved: boolean;
  criticalIssueCount: number;
  warningIssueCount: number;
  transitioned: boolean;
}
