import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialEditingPlanInput } from "./types";

const editorialEditingPlanInputSchema = z.object({
  projectId: z.string().uuid(),
});

const EDITING_PLAN_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "analyzed",
  "editing_planned",
]);

export function parseEditorialEditingPlanInput(
  input: unknown
): EditorialEditingPlanInput {
  return editorialEditingPlanInputSchema.parse(input);
}

export function assertEditingPlanState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!EDITING_PLAN_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Editing plan can only run from analyzed or editing_planned. Current state: ${parsed}.`
    );
  }

  return parsed;
}
