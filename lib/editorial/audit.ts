import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  Json,
  EditorialAiAuditEvent,
  CreateAuditEventInput,
  AiAuditActorType,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Appends an immutable audit event to the editorial audit log.
 * Always uses the service-role client so RLS cannot block writes.
 */
export async function createAuditEvent(
  input: CreateAuditEventInput
): Promise<EditorialAiAuditEvent> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_ai_audit_events")
    .insert({
      org_id: input.org_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      actor_id: input.actor_id ?? null,
      actor_type: (input.actor_type ?? "system") satisfies AiAuditActorType,
      previous_state: input.previous_state ?? null,
      new_state: input.new_state ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`[editorial/audit] createAuditEvent: ${error.message}`);
  return data as EditorialAiAuditEvent;
}

/**
 * Retrieves recent audit events for an org, newest first.
 */
export async function listAuditEvents(
  orgId: string,
  options: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    limit?: number;
  } = {}
): Promise<EditorialAiAuditEvent[]> {
  const db = getAdminClient();

  let query = db
    .from("editorial_ai_audit_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.entityType) query = query.eq("entity_type", options.entityType);
  if (options.entityId) query = query.eq("entity_id", options.entityId);
  if (options.actorId) query = query.eq("actor_id", options.actorId);

  const { data, error } = await query;

  if (error) {
    console.error("[editorial/audit] listAuditEvents error:", error);
    return [];
  }
  return (data ?? []) as EditorialAiAuditEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers for common audit actions
// ─────────────────────────────────────────────────────────────────────────────

export async function auditCreated(
  orgId: string,
  entityType: string,
  entityId: string,
  newState: Json,
  actorId?: string
): Promise<void> {
  await createAuditEvent({
    org_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
    action: "created",
    actor_id: actorId,
    actor_type: actorId ? "user" : "system",
    new_state: newState,
  });
}

export async function auditUpdated(
  orgId: string,
  entityType: string,
  entityId: string,
  previousState: Json,
  newState: Json,
  actorId?: string
): Promise<void> {
  await createAuditEvent({
    org_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
    action: "updated",
    actor_id: actorId,
    actor_type: actorId ? "user" : "system",
    previous_state: previousState,
    new_state: newState,
  });
}

export async function auditDeleted(
  orgId: string,
  entityType: string,
  entityId: string,
  previousState: Json,
  actorId?: string
): Promise<void> {
  await createAuditEvent({
    org_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
    action: "deleted",
    actor_id: actorId,
    actor_type: actorId ? "user" : "system",
    previous_state: previousState,
  });
}

export async function auditAiAction(
  orgId: string,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Json
): Promise<void> {
  await createAuditEvent({
    org_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_type: "ai",
    metadata: metadata ?? {},
  });
}
