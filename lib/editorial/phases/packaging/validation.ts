import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialPackagingInput } from "./types";

const editorialPackagingInputSchema = z.object({
  projectId: z.string().uuid(),
});

const PACKAGING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "qa_passed",
  "packaged",
]);

export function parseEditorialPackagingInput(
  input: unknown
): EditorialPackagingInput {
  return editorialPackagingInputSchema.parse(input);
}

export function assertPackagingState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!PACKAGING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Packaging can only run from qa_passed or packaged. Current state: ${parsed}.`
    );
  }

  return parsed;
}
