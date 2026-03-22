import type {
  EditorialWorkflowStageStatus,
  EditorialWorkflowState,
} from "../models";

export const EDITORIAL_WORKFLOW_SEQUENCE = [
  "received",
  "normalized",
  "analyzed",
  "editing_planned",
  "content_edited",
  "proofread",
  "validated",
  "metadata_ready",
  "cover_ready",
  "layout_ready",
  "qa_passed",
  "packaged",
  "published",
  "marketed",
] as const satisfies readonly EditorialWorkflowState[];

export const EDITORIAL_VISIBLE_WORKFLOW_SEQUENCE = [
  "received",
  "normalized",
  "analyzed",
  "editing_planned",
  "content_edited",
  "proofread",
  "validated",
  "metadata_ready",
  "cover_ready",
  "layout_ready",
  "qa_passed",
  "packaged",
  "published",
  "marketed",
] as const satisfies readonly EditorialWorkflowState[];

export const EDITORIAL_ALLOWED_STATE_TRANSITIONS: Readonly<
  Record<EditorialWorkflowState, readonly EditorialWorkflowState[]>
> = {
  received: ["normalized"],
  normalized: ["analyzed"],
  analyzed: ["editing_planned"],
  editing_planned: ["content_edited"],
  content_edited: ["proofread"],
  proofread: ["validated"],
  validated: ["metadata_ready"],
  metadata_ready: ["cover_ready", "layout_ready"],
  cover_ready: ["layout_ready"],
  layout_ready: ["qa_passed"],
  qa_passed: ["packaged"],
  packaged: ["published"],
  published: ["marketed"],
  marketed: [],
};

export const EDITORIAL_INITIAL_STATE: EditorialWorkflowState = "received";

export const EDITORIAL_INITIAL_STAGE_STATUS: EditorialWorkflowStageStatus =
  "in_progress";

export const EDITORIAL_FUTURE_STAGE_STATUS: EditorialWorkflowStageStatus =
  "pending";
