import { logEditorialActivity } from "@/lib/editorial/db/mutations";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events/service";
import { ORG_ID } from "@/lib/leads/helpers";

interface ReceptionLogContext {
  projectId: string;
  actorId: string;
  payload?: Record<string, unknown>;
}

async function logReceptionActivity(eventType: string, context: ReceptionLogContext) {
  await logEditorialActivity(context.projectId, eventType, {
    stageKey: "recepcion",
    actorId: context.actorId,
    actorType: "user",
    payload: context.payload,
  });
}

export async function logReceptionStarted(context: ReceptionLogContext) {
  await logReceptionActivity("workflow.reception.started", context);
}

export async function logReceptionProjectCreated(context: ReceptionLogContext) {
  await logReceptionActivity("workflow.reception.project_created", context);
}

export async function logReceptionUploadPrepared(context: ReceptionLogContext) {
  await logReceptionActivity("workflow.reception.upload_prepared", context);
}

export async function logReceptionCompleted(context: ReceptionLogContext) {
  await logReceptionActivity("workflow.reception.completed", context);

  try {
    await logWorkflowEvent({
      orgId: ORG_ID,
      projectId: context.projectId,
      stageKey: "recepcion",
      eventType: "manuscript_submitted",
      actorId: context.actorId,
      actorRole: "user",
      payload: context.payload ?? null,
    });
  } catch (error) {
    console.error("[editorial][reception] Failed to mirror workflow event", {
      projectId: context.projectId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
