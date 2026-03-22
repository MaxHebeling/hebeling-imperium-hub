import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialQualityAssuranceInput } from "./types";

const editorialQualityAssuranceInputSchema = z.object({
  projectId: z.string().uuid(),
});

const QUALITY_ASSURANCE_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "layout_ready",
  "qa_passed",
]);

export function parseEditorialQualityAssuranceInput(
  input: unknown
): EditorialQualityAssuranceInput {
  return editorialQualityAssuranceInputSchema.parse(input);
}

export function assertQualityAssuranceState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!QUALITY_ASSURANCE_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Quality assurance can only run from layout_ready or qa_passed. Current state: ${parsed}.`
    );
  }

  return parsed;
}
