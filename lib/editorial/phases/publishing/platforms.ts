import {
  DISTRIBUTION_CHANNEL_LABELS,
  type DistributionChannel,
} from "@/lib/editorial/distribution/types";
import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import type {
  EditorialPlatformPublication,
  EditorialPublishingAttempt,
  EditorialPublishingPayload,
  EditorialPublishingPlatform,
} from "./types";

interface MockPublishInput {
  projectId: string;
  platform: EditorialPublishingPlatform;
  payload: EditorialPublishingPayload;
  maxRetries: number;
}

function buildExternalUrl(
  platform: EditorialPublishingPlatform,
  externalId: string
): string {
  return `https://mock-distribution.reinoeditorial.com/${platform}/${externalId}`;
}

function createAttempt(
  attempt: number,
  status: EditorialPublishingAttempt["status"],
  error: string | null
): EditorialPublishingAttempt {
  const timestamp = createFoundationTimestamp();
  return {
    attempt,
    status,
    started_at: timestamp,
    finished_at: timestamp,
    error,
  };
}

function assertPayloadForPlatform(
  platform: EditorialPublishingPlatform,
  payload: EditorialPublishingPayload
): void {
  if (!payload.title.trim()) {
    throw new Error("Publishing payload requires a non-empty title.");
  }

  if (!payload.description.trim()) {
    throw new Error("Publishing payload requires a non-empty description.");
  }

  if (!payload.epub_url.trim()) {
    throw new Error("Publishing payload requires an EPUB URL.");
  }

  if (platform === "amazon_kdp" && !payload.pdf_url.trim()) {
    throw new Error("Amazon KDP requires a print-ready PDF URL.");
  }
}

export async function publishToMockPlatform(
  input: MockPublishInput
): Promise<EditorialPlatformPublication> {
  const attempts: EditorialPublishingAttempt[] = [];

  for (let attempt = 1; attempt <= input.maxRetries; attempt++) {
    try {
      attempts.push(createAttempt(attempt, "submitted", null));
      assertPayloadForPlatform(input.platform, input.payload);

      const externalId = createFoundationId();
      return {
        platform: input.platform,
        status: "published",
        external_id: externalId,
        external_url: buildExternalUrl(input.platform, externalId),
        payload: input.payload,
        attempts: [
          ...attempts,
          createAttempt(attempt, "published", null),
        ],
        published_at: createFoundationTimestamp(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown publishing error.";
      attempts.push(createAttempt(attempt, "failed", message));

      if (attempt === input.maxRetries) {
        return {
          platform: input.platform,
          status: "failed",
          external_id: null,
          external_url: null,
          payload: input.payload,
          attempts,
          published_at: null,
        };
      }
    }
  }

  return {
    platform: input.platform,
    status: "failed",
    external_id: null,
    external_url: null,
    payload: input.payload,
    attempts,
    published_at: null,
  };
}

export function getPublishingPlatformLabel(
  platform: EditorialPublishingPlatform
): string {
  return DISTRIBUTION_CHANNEL_LABELS[platform as DistributionChannel];
}
