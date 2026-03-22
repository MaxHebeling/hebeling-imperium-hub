import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export type CoverVariationKey = "iconic" | "narrative" | "typographic";

export interface EditorialCoverGenerationInput {
  projectId: string;
}

export interface EditorialCreativeDirection {
  version: 1;
  genre: string;
  target_audience: string;
  positioning_statement: string;
  mood: string;
  palette: string[];
  visual_symbols: string[];
  composition_notes: string[];
  typography_direction: string;
  image_style: string;
  negative_prompts: string[];
}

export interface EditorialCoverVariation {
  id: string;
  key: CoverVariationKey;
  title: string;
  rationale: string;
  market_angle: string;
  prompt: string;
  revised_prompt: string;
  storage_path: string;
  public_url: string;
}

export interface EditorialCoverConceptPackage {
  schema_version: 1;
  project_id: string;
  metadata_asset_id: string;
  validated_asset_id: string;
  creative_direction: EditorialCreativeDirection;
  variations: EditorialCoverVariation[];
  generated_at: string;
  model: string;
}

export interface EditorialCoverGenerationResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  metadataAssetId: string;
  validatedAssetId: string;
  coverAssetId: string;
  coverAssetUri: string;
  variationCount: number;
  transitioned: boolean;
}
