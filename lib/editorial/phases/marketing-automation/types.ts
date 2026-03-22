import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export interface EditorialMarketingAutomationInput {
  projectId: string;
}

export type MarketingChannel =
  | "meta_ads"
  | "google_ads"
  | "email"
  | "landing_page";

export interface MarketingCopyAsset {
  channel: Exclude<MarketingChannel, "email" | "landing_page">;
  headline: string;
  primary_text: string;
  call_to_action: string;
  audience_angle: string;
}

export interface MarketingEmailStep {
  sequence_key: string;
  step_order: number;
  subject: string;
  preview_text: string;
  body: string;
  call_to_action: string;
}

export interface MarketingLandingPageSection {
  key: string;
  heading: string;
  body: string;
}

export interface MarketingCampaignPlan {
  id: string;
  name: string;
  objective: string;
  channels: MarketingChannel[];
  audience: string;
  core_message: string;
  call_to_action: string;
}

export interface EditorialMarketingKit {
  schema_version: 1;
  project_id: string;
  metadata_asset_id: string;
  cover_asset_id: string | null;
  publication_asset_id: string;
  positioning_hook: string;
  ad_copies: MarketingCopyAsset[];
  email_sequence: MarketingEmailStep[];
  landing_page: {
    hero_title: string;
    hero_subtitle: string;
    sections: MarketingLandingPageSection[];
    primary_call_to_action: string;
  };
  campaign_structure: MarketingCampaignPlan[];
  generated_at: string;
  model: string;
}

export interface EditorialMarketingAutomationResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  publicationAssetId: string;
  marketingAssetId: string;
  marketingAssetUri: string;
  campaignCount: number;
  transitioned: boolean;
}
