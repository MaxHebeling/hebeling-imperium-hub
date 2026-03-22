import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export interface EditorialMetadataGenerationInput {
  projectId: string;
}

export interface EditorialMetadataPackage {
  schema_version: 1;
  project_id: string;
  validated_asset_id: string;
  optimized_title: string;
  subtitle: string;
  book_description: string;
  keywords: string[];
  categories: string[];
  target_audience: string;
  positioning_statement: string;
  seo_notes: string[];
  generated_at: string;
  model: string;
}

export interface EditorialMetadataGenerationResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  validatedAssetId: string;
  metadataAssetId: string;
  metadataAssetUri: string;
  transitioned: boolean;
}
