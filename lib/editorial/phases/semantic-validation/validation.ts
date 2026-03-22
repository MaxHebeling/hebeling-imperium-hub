import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialSemanticValidationInput } from "./types";

const editorialSemanticValidationInputSchema = z.object({
  projectId: z.string().uuid(),
});

const SEMANTIC_VALIDATION_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "proofread",
  "validated",
]);

export function parseEditorialSemanticValidationInput(
  input: unknown
): EditorialSemanticValidationInput {
  return editorialSemanticValidationInputSchema.parse(input);
}

export function assertSemanticValidationState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!SEMANTIC_VALIDATION_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Semantic validation can only run from proofread or validated. Current state: ${parsed}.`
    );
  }

  return parsed;
}
