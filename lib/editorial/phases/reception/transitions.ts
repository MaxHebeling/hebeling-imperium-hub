import type {
  EditorialWorkflowState,
  ReceptionTransition,
  ReceptionTransitionState,
} from "./types";

const RECEPTION_TRANSITION_GRAPH: Record<
  ReceptionTransitionState,
  readonly ReceptionTransitionState[]
> = {
  initialized: ["project_created"],
  project_created: ["upload_prepared"],
  upload_prepared: ["received"],
  received: [],
};

function workflowStateForTransition(
  transitionState: ReceptionTransitionState
): EditorialWorkflowState | null {
  return transitionState === "received" ? "received" : null;
}

export function canTransitionReceptionState(
  from: ReceptionTransitionState,
  to: ReceptionTransitionState
): boolean {
  return RECEPTION_TRANSITION_GRAPH[from].includes(to);
}

export function createReceptionTransition(
  from: ReceptionTransitionState,
  to: ReceptionTransitionState,
  occurredAt = new Date().toISOString()
): ReceptionTransition {
  if (!canTransitionReceptionState(from, to)) {
    throw new Error(`Invalid reception transition: ${from} -> ${to}`);
  }

  return {
    from,
    to,
    workflowState: workflowStateForTransition(to),
    occurredAt,
  };
}
