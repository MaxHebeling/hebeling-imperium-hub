import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "../types/editorial";
import type { EditorialAiTaskKey } from "../types/ai";
import { logWorkflowEvent } from "../workflow-events";
import { requestStageAiAssist, isTaskAllowedForStage } from "../ai/stage-assist";

/**
 * Stage configuration: defines behavior for each stage
 */
export const STAGE_CONFIG: Record<
  EditorialStageKey,
  {
    autoStart: boolean; // If true, starts processing automatically
    requiresReview: boolean; // If true, requires manual review before completion
    aiTaskKey?: string; // AI task to trigger when stage starts
  }
> = {
  ingesta: {
    autoStart: true,
    requiresReview: true,
    aiTaskKey: "manuscript_analysis",
  },
  estructura: {
    autoStart: false,
    requiresReview: true,
    aiTaskKey: "structure_analysis",
  },
  estilo: {
    autoStart: false,
    requiresReview: true,
    aiTaskKey: "style_suggestions",
  },
  ortotipografia: {
    autoStart: false,
    requiresReview: true,
    aiTaskKey: "orthotypography_review",
  },
  maquetacion: {
    autoStart: false,
    requiresReview: true,
  },
  revision_final: {
    autoStart: false,
    requiresReview: true,
  },
  export: {
    autoStart: false,
    requiresReview: false,
  },
  distribution: {
    autoStart: false,
    requiresReview: false,
  },
};

/**
 * Initialize a stage when the project advances to it.
 * Sets started_at and appropriate initial status.
 */
export async function initializeNextStage(options: {
  projectId: string;
  stageKey: EditorialStageKey;
  actorId?: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const config = STAGE_CONFIG[options.stageKey];

  // Determine initial status based on stage config
  const initialStatus = config.autoStart ? "processing" : "pending";

  // Update the stage record
  const { error } = await supabase
    .from("editorial_stages")
    .update({
      status: initialStatus,
      started_at: now,
    })
    .eq("project_id", options.projectId)
    .eq("stage_key", options.stageKey);

  if (error) {
    throw new Error(`Failed to initialize stage ${options.stageKey}: ${error.message}`);
  }

  // Get project org_id for logging
  const { data: project } = await supabase
    .from("editorial_projects")
    .select("org_id")
    .eq("id", options.projectId)
    .single();

  if (project) {
    await logWorkflowEvent({
      orgId: project.org_id,
      projectId: options.projectId,
      stageKey: options.stageKey,
      eventType: "stage_started",
      actorId: options.actorId ?? null,
      payload: { initialStatus, autoStart: config.autoStart },
    });

    // Auto-trigger AI task if configured and stage auto-starts
    if (config.autoStart && config.aiTaskKey) {
      const aiTaskKey = config.aiTaskKey as EditorialAiTaskKey;
      if (isTaskAllowedForStage(options.stageKey, aiTaskKey)) {
        try {
          // Get the latest file for this project to use as source
          const { data: latestFile } = await supabase
            .from("editorial_files")
            .select("id, version_number")
            .eq("project_id", options.projectId)
            .order("version_number", { ascending: false })
            .limit(1)
            .single();

          await requestStageAiAssist({
            orgId: project.org_id,
            projectId: options.projectId,
            stageKey: options.stageKey,
            taskKey: aiTaskKey,
            requestedBy: options.actorId ?? "system",
            sourceFileId: latestFile?.id,
            sourceFileVersion: latestFile?.version_number,
          });

          await logWorkflowEvent({
            orgId: project.org_id,
            projectId: options.projectId,
            stageKey: options.stageKey,
            eventType: "ai_task_queued",
            actorId: options.actorId ?? null,
            payload: { taskKey: aiTaskKey, autoTriggered: true },
          });
        } catch (aiError) {
          console.error(`[stage-transitions] Failed to queue AI task for ${options.stageKey}:`, aiError);
          // Don't fail the stage initialization if AI task fails
        }
      }
    }
  }
}

/**
 * Transition a stage to a new status with proper validation and logging.
 */
export async function transitionStageStatus(options: {
  projectId: string;
  stageKey: EditorialStageKey;
  fromStatus: string;
  toStatus: string;
  actorId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  // Build the update payload based on the target status
  const updatePayload: Record<string, unknown> = {
    status: options.toStatus,
  };

  // Set timestamps based on status transitions
  if (options.toStatus === "processing" && options.fromStatus === "pending") {
    updatePayload.started_at = now;
  }
  if (options.toStatus === "completed" || options.toStatus === "approved") {
    updatePayload.completed_at = now;
  }

  const { error } = await supabase
    .from("editorial_stages")
    .update(updatePayload)
    .eq("project_id", options.projectId)
    .eq("stage_key", options.stageKey);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the current status of a stage.
 */
export async function getStageStatus(
  projectId: string,
  stageKey: EditorialStageKey
): Promise<string | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("editorial_stages")
    .select("status")
    .eq("project_id", projectId)
    .eq("stage_key", stageKey)
    .single();

  return data?.status ?? null;
}
