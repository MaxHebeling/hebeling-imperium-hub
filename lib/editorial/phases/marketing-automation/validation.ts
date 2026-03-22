import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialMarketingAutomationInput } from "./types";

const editorialMarketingAutomationInputSchema = z.object({
  projectId: z.string().uuid(),
});

const MARKETING_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "published",
  "marketed",
]);

export function parseEditorialMarketingAutomationInput(
  input: unknown
): EditorialMarketingAutomationInput {
  return editorialMarketingAutomationInputSchema.parse(input);
}

export function assertMarketingAutomationState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!MARKETING_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Marketing automation can only run from published or marketed. Current state: ${parsed}.`
    );
  }

  return parsed;
}
