import { z } from "zod";
import { EDITORIAL_ALLOWED_STATE_TRANSITIONS, EDITORIAL_WORKFLOW_SEQUENCE } from "./constants";
import type { EditorialProjectAggregate, EditorialWorkflowState } from "../models";

export const editorialWorkflowStateSchema = z.enum(
  EDITORIAL_WORKFLOW_SEQUENCE
);

export const editorialWorkflowStageStatusSchema = z.enum([
  "pending",
  "ready",
  "in_progress",
  "completed",
  "failed",
  "blocked",
]);

export const manuscriptSourceTypeSchema = z.enum([
  "upload",
  "import",
  "external",
]);

export const pipelineLogLevelSchema = z.enum([
  "debug",
  "info",
  "warning",
  "error",
]);

export const editorialAgentProviderSchema = z.enum([
  "hebeling_ai",
  "human",
  "internal",
]);

export const editorialMetadataSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  author: z.string().trim().min(1),
  title: z.string().trim().min(1),
  subtitle: z.string().nullable(),
  language: z.string().trim().min(2).max(12),
  genre: z.string().trim().min(1),
  synopsis: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const manuscriptAssetSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  source_type: manuscriptSourceTypeSchema,
  source_label: z.string().trim().min(1),
  source_uri: z.string().nullable(),
  original_file_name: z.string().trim().min(1),
  mime_type: z.string().trim().min(1),
  checksum: z.string().nullable(),
  size_bytes: z.number().int().positive().nullable(),
  extracted_text_uri: z.string().nullable(),
  version: z.number().int().positive(),
  uploaded_at: z.string().datetime(),
});

export const editorialAgentRefSchema = z.object({
  provider: editorialAgentProviderSchema,
  model: z.string().nullable(),
  version: z.string().nullable(),
});

export const pipelineCostSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("USD"),
  estimated: z.boolean(),
});

export const pipelineLogSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  workflow_id: z.string().uuid().nullable(),
  stage_id: z.string().uuid().nullable(),
  stage_key: editorialWorkflowStateSchema.nullable(),
  event_type: z.string().trim().min(1),
  level: pipelineLogLevelSchema,
  message: z.string().trim().min(1),
  payload: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

export const editorialWorkflowStageSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  stage_key: editorialWorkflowStateSchema,
  status: editorialWorkflowStageStatusSchema,
  started_at: z.string().datetime().nullable(),
  finished_at: z.string().datetime().nullable(),
  agent_used: editorialAgentRefSchema.nullable(),
  cost: pipelineCostSchema.nullable(),
  output_file: manuscriptAssetSchema.nullable(),
  logs: z.array(pipelineLogSchema),
});

export const editorialWorkflowTransitionSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  from_state: editorialWorkflowStateSchema.nullable(),
  to_state: editorialWorkflowStateSchema,
  transitioned_at: z.string().datetime(),
  validated: z.boolean(),
  reason: z.string().nullable(),
});

export const editorialWorkflowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  current_state: editorialWorkflowStateSchema,
  stages: z.array(editorialWorkflowStageSchema),
  transitions: z.array(editorialWorkflowTransitionSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const editorialProjectSchema = z.object({
  id: z.string().uuid(),
  author: z.string().trim().min(1),
  title: z.string().trim().min(1),
  manuscript_source: manuscriptSourceTypeSchema,
  language: z.string().trim().min(2).max(12),
  genre: z.string().trim().min(1),
  current_status: editorialWorkflowStateSchema,
  metadata: editorialMetadataSchema,
  manuscript_asset: manuscriptAssetSchema,
  workflow_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const editorialProjectAggregateSchema = z.object({
  project: editorialProjectSchema,
  workflow: editorialWorkflowSchema,
  logs: z.array(pipelineLogSchema),
});

export const editorialProjectInitializationInputSchema = z.object({
  author: z.string().trim().min(1),
  title: z.string().trim().min(1),
  manuscriptSource: manuscriptSourceTypeSchema,
  originalFileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  language: z.string().trim().min(2).max(12).default("es"),
  genre: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().nullable().optional(),
  subtitle: z.string().trim().nullable().optional(),
  synopsis: z.string().trim().nullable().optional(),
  tags: z.array(z.string()).optional(),
  sourceLabel: z.string().trim().min(1).optional(),
  sourceUri: z.string().nullable().optional(),
  checksum: z.string().nullable().optional(),
});

export const workflowTransitionRequestSchema = z
  .object({
    from: editorialWorkflowStateSchema,
    to: editorialWorkflowStateSchema,
  })
  .superRefine((value, ctx) => {
    const allowedTargets = EDITORIAL_ALLOWED_STATE_TRANSITIONS[value.from];
    if (!allowedTargets.includes(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Transition ${value.from} -> ${value.to} is not allowed.`,
        path: ["to"],
      });
    }
  });

export function isAllowedWorkflowTransition(
  from: EditorialWorkflowState,
  to: EditorialWorkflowState
): boolean {
  return EDITORIAL_ALLOWED_STATE_TRANSITIONS[from].includes(to);
}

export function assertAllowedWorkflowTransition(
  from: EditorialWorkflowState,
  to: EditorialWorkflowState
): void {
  workflowTransitionRequestSchema.parse({ from, to });
}

export function validateEditorialProjectAggregate(
  aggregate: EditorialProjectAggregate
): EditorialProjectAggregate {
  return editorialProjectAggregateSchema.parse(aggregate);
}
