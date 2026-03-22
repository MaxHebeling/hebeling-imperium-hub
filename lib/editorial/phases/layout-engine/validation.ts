import { z } from "zod";
import { editorialWorkflowStateSchema } from "@/lib/editorial/foundation/pipeline/validators";
import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditorialLayoutEngineInput } from "./types";

const editorialLayoutEngineInputSchema = z.object({
  projectId: z.string().uuid(),
});

const LAYOUT_ENGINE_ALLOWED_STATES = new Set<EditorialWorkflowState>([
  "metadata_ready",
  "cover_ready",
  "layout_ready",
]);

export function parseEditorialLayoutEngineInput(
  input: unknown
): EditorialLayoutEngineInput {
  return editorialLayoutEngineInputSchema.parse(input);
}

export function assertLayoutEngineState(
  state: string | null | undefined
): EditorialWorkflowState {
  const parsed = editorialWorkflowStateSchema.parse(state);

  if (!LAYOUT_ENGINE_ALLOWED_STATES.has(parsed)) {
    throw new Error(
      `Layout engine can only run from metadata_ready, cover_ready, or layout_ready. Current state: ${parsed}.`
    );
  }

  return parsed;
}
