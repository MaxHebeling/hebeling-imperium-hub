import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialCoverGenerationInput } from "./types";

const editorialCoverGenerationInputSchema = z.object({
  projectId: z.string().uuid(),
});

const COVER_GENERATION_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "metadata_ready",
  "cover_ready",
]);

export function parseEditorialCoverGenerationInput(
  input: unknown
): EditorialCoverGenerationInput {
  return editorialCoverGenerationInputSchema.parse(input);
}

export function assertCoverGenerationState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!COVER_GENERATION_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Cover generation can only run from metadata_ready or cover_ready. Current state: ${parsed}.`
    );
  }

  return parsed;
}
