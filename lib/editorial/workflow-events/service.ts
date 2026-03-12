import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey, EditorialWorkflowEventType } from "@/lib/editorial/types/editorial";

export async function logWorkflowEvent(options: {
  orgId: string;
  projectId: string;
  stageKey?: EditorialStageKey | null;
  eventType: EditorialWorkflowEventType;
  actorId?: string | null;
  actorRole?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("editorial_workflow_events").insert({
    org_id: options.orgId,
    project_id: options.projectId,
    stage_key: options.stageKey ?? null,
    event_type: options.eventType,
    actor_id: options.actorId ?? null,
    actor_role: options.actorRole ?? null,
    payload: options.payload ?? null,
  });
  if (error) {
    throw new Error(`Failed to log workflow event: ${error.message}`);
  }
}

