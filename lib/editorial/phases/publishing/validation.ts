import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type {
  EditorialPublishingInput,
  EditorialPublishingPlatform,
} from "./types";

const supportedPlatforms = [
  "amazon_kdp",
  "apple_books",
  "google_play",
] as const satisfies readonly EditorialPublishingPlatform[];

const editorialPublishingInputSchema = z.object({
  projectId: z.string().uuid(),
  platforms: z.array(z.enum(supportedPlatforms)).min(1).max(3).optional(),
  maxRetries: z.number().int().min(1).max(5).optional(),
});

const PUBLISHING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "packaged",
  "published",
]);

export function parseEditorialPublishingInput(
  input: unknown
): EditorialPublishingInput {
  return editorialPublishingInputSchema.parse(input);
}

export function assertPublishingState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!PUBLISHING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Publishing can only run from packaged or published. Current state: ${parsed}.`
    );
  }

  return parsed;
}

export function resolvePublishingPlatforms(
  platforms?: EditorialPublishingPlatform[]
): EditorialPublishingPlatform[] {
  const resolved = platforms?.length
    ? platforms
    : (["amazon_kdp", "apple_books"] as EditorialPublishingPlatform[]);

  return [...new Set(resolved)];
}
