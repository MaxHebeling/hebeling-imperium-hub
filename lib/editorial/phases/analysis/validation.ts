import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialAnalysisInput } from "./types";

const editorialAnalysisInputSchema = z.object({
  projectId: z.string().uuid(),
});

const ANALYSIS_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "normalized",
  "analyzed",
]);

export function parseEditorialAnalysisInput(input: unknown): EditorialAnalysisInput {
  return editorialAnalysisInputSchema.parse(input);
}

export function assertAnalysisState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!ANALYSIS_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Editorial analysis can only run from normalized or analyzed. Current state: ${parsed}.`
    );
  }

  return parsed;
}
