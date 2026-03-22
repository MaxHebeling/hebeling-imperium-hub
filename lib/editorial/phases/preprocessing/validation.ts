import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialPreprocessingInput } from "./types";

const editorialPreprocessingInputSchema = z.object({
  projectId: z.string().uuid(),
});

const PREPROCESSING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "received",
  "normalized",
]);

type EditorialPreprocessingState = "received" | "normalized";

export function parseEditorialPreprocessingInput(
  input: unknown
): EditorialPreprocessingInput {
  return editorialPreprocessingInputSchema.parse(input);
}

export function assertPreprocessingState(
  state: string | null | undefined
): EditorialPreprocessingState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!PREPROCESSING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Preprocessing can only run from received or normalized. Current state: ${parsed}.`
    );
  }

  return parsed as EditorialPreprocessingState;
}
