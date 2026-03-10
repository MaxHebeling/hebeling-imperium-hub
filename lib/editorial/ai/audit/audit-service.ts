// =============================================================================
// AI Audit Service
// Reino Editorial AI Engine · Phase 5B
// =============================================================================
// Writes immutable audit events to editorial_ai_audit_events with an
// AI-execution-focused interface that accepts project_id, stage_key, and
// event_payload as first-class parameters (mapped to DB columns internally).
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialAiAuditEvent,
  AiAuditActorType,
  EditorialStage,
  Json,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateAiAuditEventInput {
  /** Organisation the event belongs to — required for RLS partitioning. */
  org_id: string;
  /** Convenience field stored inside metadata.project_id. */
  project_id?: string;
  /** Convenience field stored inside metadata.stage_key. */
  stage_key?: EditorialStage;
  /**
   * Type of the entity this event describes.
   * e.g. 'job_run' | 'finding' | 'prompt_version' | 'policy'
   */
  entity_type: string;
  /** UUID of the entity described by entity_type. */
  entity_id: string;
  /**
   * The action / event name.
   * e.g. 'run_started' | 'run_completed' | 'run_failed' | 'finding_created'
   */
  event_type: string;
  /** Who or what performed the action. */
  actor_type: AiAuditActorType;
  /** Profile UUID of the actor (null for system/ai actions). */
  actor_id?: string;
  /**
   * Structured payload for the event — stored inside metadata.event_payload.
   * Keep lightweight: reference IDs rather than full payload copies.
   */
  event_payload?: Json;
  /** Entity state before the action (for diff-based auditing). */
  previous_state?: Json;
  /** Entity state after the action. */
  new_state?: Json;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appends an immutable audit event using the service-role client so RLS
 * cannot block inserts from server-side AI runners.
 *
 * Maps the AI-execution-focused input interface to the editorial_ai_audit_events
 * DB schema: `event_type → action`, `event_payload → metadata.event_payload`,
 * `project_id + stage_key → metadata`.
 */
export async function createAiAuditEvent(
  input: CreateAiAuditEventInput
): Promise<EditorialAiAuditEvent> {
  const db = getAdminClient();

  const metadata: Record<string, Json> = {};
  if (input.project_id) metadata.project_id = input.project_id;
  if (input.stage_key) metadata.stage_key = input.stage_key;
  if (input.event_payload !== undefined) metadata.event_payload = input.event_payload;

  const { data, error } = await db
    .from("editorial_ai_audit_events")
    .insert({
      org_id: input.org_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.event_type,
      actor_type: input.actor_type,
      actor_id: input.actor_id ?? null,
      previous_state: input.previous_state ?? null,
      new_state: input.new_state ?? null,
      metadata,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[audit-service] createAiAuditEvent failed: ${error.message}`);
  }

  return data as EditorialAiAuditEvent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers for common AI lifecycle events
// ─────────────────────────────────────────────────────────────────────────────

/** Emits a 'run_started' audit event for a job run. */
export async function auditRunStarted(
  orgId: string,
  runId: string,
  context: { project_id: string; stage_key: EditorialStage; model_id?: string }
): Promise<void> {
  await createAiAuditEvent({
    org_id: orgId,
    entity_type: "job_run",
    entity_id: runId,
    event_type: "run_started",
    actor_type: "system",
    project_id: context.project_id,
    stage_key: context.stage_key,
    event_payload: { model_id: context.model_id ?? null },
  });
}

/** Emits a 'run_completed' audit event for a job run. */
export async function auditRunCompleted(
  orgId: string,
  runId: string,
  context: {
    project_id: string;
    stage_key: EditorialStage;
    token_usage_input: number;
    token_usage_output: number;
    estimated_cost: number;
  }
): Promise<void> {
  await createAiAuditEvent({
    org_id: orgId,
    entity_type: "job_run",
    entity_id: runId,
    event_type: "run_completed",
    actor_type: "system",
    project_id: context.project_id,
    stage_key: context.stage_key,
    event_payload: {
      token_usage_input: context.token_usage_input,
      token_usage_output: context.token_usage_output,
      estimated_cost: context.estimated_cost,
    },
  });
}

/** Emits a 'run_failed' audit event for a job run. */
export async function auditRunFailed(
  orgId: string,
  runId: string,
  context: {
    project_id: string;
    stage_key: EditorialStage;
    error_type: string;
    error_message: string;
  }
): Promise<void> {
  await createAiAuditEvent({
    org_id: orgId,
    entity_type: "job_run",
    entity_id: runId,
    event_type: "run_failed",
    actor_type: "system",
    project_id: context.project_id,
    stage_key: context.stage_key,
    event_payload: {
      error_type: context.error_type,
      error_message: context.error_message,
    },
  });
}
