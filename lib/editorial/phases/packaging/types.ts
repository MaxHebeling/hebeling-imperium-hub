import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export interface EditorialPackagingInput {
  projectId: string;
}

export type EditorialPackageFileRole =
  | "print_pdf"
  | "digital_epub"
  | "metadata"
  | "qa_report"
  | "cover_image"
  | "package_manifest";

export interface EditorialPackageFile {
  role: EditorialPackageFileRole;
  file_name: string;
  relative_path: string;
  source_storage_path: string | null;
  public_url: string | null;
  mime_type: string;
  size_bytes: number;
}

export interface EditorialFinalPackageManifest {
  schema_version: 1;
  project_id: string;
  qa_asset_id: string;
  layout_asset_id: string;
  metadata_asset_id: string;
  cover_asset_id: string | null;
  bundle_storage_path: string;
  bundle_public_url: string;
  files: EditorialPackageFile[];
  folder_structure: string[];
  summary: string;
  generated_at: string;
}

export interface EditorialPackagingResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  qaAssetId: string;
  packageAssetId: string;
  packageAssetUri: string;
  bundleStoragePath: string;
  fileCount: number;
  transitioned: boolean;
}
