import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialContentEditingInput } from "./types";

const editorialContentEditingInputSchema = z.object({
  projectId: z.string().uuid(),
});

const CONTENT_EDITING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "editing_planned",
  "content_edited",
]);

export function parseEditorialContentEditingInput(
  input: unknown
): EditorialContentEditingInput {
  return editorialContentEditingInputSchema.parse(input);
}

export function assertContentEditingState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!CONTENT_EDITING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Content editing can only run from editing_planned or content_edited. Current state: ${parsed}.`
    );
  }

  return parsed;
}
