import type { EditorialWorkflowState } from "../models";
import { EDITORIAL_ALLOWED_STATE_TRANSITIONS, EDITORIAL_WORKFLOW_SEQUENCE } from "./constants";
import { assertAllowedWorkflowTransition } from "./validators";

export function getNextEditorialWorkflowState(
  currentState: EditorialWorkflowState
): EditorialWorkflowState | null {
  const currentIndex = EDITORIAL_WORKFLOW_SEQUENCE.indexOf(currentState);
  if (currentIndex < 0 || currentIndex === EDITORIAL_WORKFLOW_SEQUENCE.length - 1) {
    return null;
  }

  return EDITORIAL_WORKFLOW_SEQUENCE[currentIndex + 1] ?? null;
}

export function getAllowedEditorialWorkflowTransitions(
  state: EditorialWorkflowState
): readonly EditorialWorkflowState[] {
  return EDITORIAL_ALLOWED_STATE_TRANSITIONS[state];
}

export function validateEditorialWorkflowTransition(
  from: EditorialWorkflowState,
  to: EditorialWorkflowState
): void {
  assertAllowedWorkflowTransition(from, to);
}
