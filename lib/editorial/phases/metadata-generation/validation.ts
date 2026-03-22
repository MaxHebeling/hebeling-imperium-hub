import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialMetadataGenerationInput } from "./types";

const editorialMetadataGenerationInputSchema = z.object({
  projectId: z.string().uuid(),
});

const METADATA_GENERATION_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "validated",
  "metadata_ready",
]);

export function parseEditorialMetadataGenerationInput(
  input: unknown
): EditorialMetadataGenerationInput {
  return editorialMetadataGenerationInputSchema.parse(input);
}

export function assertMetadataGenerationState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!METADATA_GENERATION_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Metadata generation can only run from validated or metadata_ready. Current state: ${parsed}.`
    );
  }

  return parsed;
}
