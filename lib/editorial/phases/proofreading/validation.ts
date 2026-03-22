import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialProofreadingInput } from "./types";

const editorialProofreadingInputSchema = z.object({
  projectId: z.string().uuid(),
});

const PROOFREADING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "content_edited",
  "proofread",
]);

export function parseEditorialProofreadingInput(
  input: unknown
): EditorialProofreadingInput {
  return editorialProofreadingInputSchema.parse(input);
}

export function assertProofreadingState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!PROOFREADING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Proofreading can only run from content_edited or proofread. Current state: ${parsed}.`
    );
  }

  return parsed;
}
