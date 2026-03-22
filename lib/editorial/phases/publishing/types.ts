import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { DistributionChannel } from "@/lib/editorial/distribution/types";

export type EditorialPublishingPlatform = Extract<
  DistributionChannel,
  "amazon_kdp" | "apple_books" | "google_play"
>;

export type EditorialPublishingStatus =
  | "pending"
  | "submitted"
  | "published"
  | "failed";

export interface EditorialPublishingInput {
  projectId: string;
  platforms?: EditorialPublishingPlatform[];
  maxRetries?: number;
}

export interface EditorialPublishingPayload {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
  language: string;
  author: string | null;
  bundle_url: string;
  pdf_url: string;
  epub_url: string;
  cover_url: string | null;
}

export interface EditorialPublishingAttempt {
  attempt: number;
  status: EditorialPublishingStatus;
  started_at: string;
  finished_at: string;
  error: string | null;
}

export interface EditorialPlatformPublication {
  platform: EditorialPublishingPlatform;
  status: EditorialPublishingStatus;
  external_id: string | null;
  external_url: string | null;
  payload: EditorialPublishingPayload;
  attempts: EditorialPublishingAttempt[];
  published_at: string | null;
}

export interface EditorialPublishedPackage {
  schema_version: 1;
  project_id: string;
  package_asset_id: string;
  metadata_asset_id: string;
  cover_asset_id: string | null;
  platforms: EditorialPlatformPublication[];
  summary: string;
  generated_at: string;
}

export interface EditorialPublishingResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  packageAssetId: string;
  publicationAssetId: string;
  publicationAssetUri: string;
  platformCount: number;
  publishedCount: number;
  transitioned: boolean;
}
