import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { updateStageStatus, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { getAdminClient } from "@/lib/leads/helpers";
import { STAGE_CONFIG } from "@/lib/editorial/pipeline/stage-transitions";
import { requestStageAiAssist, isTaskAllowedForStage } from "@/lib/editorial/ai/stage-assist";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import {
  mapLegacyStageToWorkflowStage,
  WORKFLOW_STAGE_AI_CONFIG,
} from "@/lib/editorial/stage-engine/service";

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/start
 *
 * Manually starts a stage that is in "pending" status.
 * Changes status to "processing" and optionally triggers AI task.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; stageKey: string }> }
) {
  try {
    const staff = await requireStaff();
    const body = await request.json().catch(() => ({}));
    const { triggerAi = true } = body as { triggerAi?: boolean };

    const { projectId, stageKey } = await params;
    if (!isValidStageKey(stageKey)) {
      return NextResponse.json(
        { success: false, error: `Invalid stageKey: ${stageKey}` },
        { status: 400 }
      );
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Check permission
    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "stage:approve",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Verify stage is in pending status
    const supabase = getAdminClient();
    const { data: stage } = await supabase
      .from("editorial_stages")
      .select("status")
      .eq("project_id", projectId)
      .eq("stage_key", stageKey)
      .single();

    if (!stage) {
      return NextResponse.json({ success: false, error: "Stage not found" }, { status: 404 });
    }

    if (stage.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Stage must be in 'pending' status to start. Current: ${stage.status}` },
        { status: 409 }
      );
    }

    // Update stage to processing
    const now = new Date().toISOString();
    await supabase
      .from("editorial_stages")
      .update({
        status: "processing",
        started_at: now,
      })
      .eq("project_id", projectId)
      .eq("stage_key", stageKey);

    // Log the event
    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      stageKey,
      eventType: "stage_started",
      actorId: staff.userId,
      actorRole: staff.role,
      payload: { manualStart: true },
    });

    await logEditorialActivity(projectId, "stage_started_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { manualStart: true },
    });

    // Optionally trigger AI task
    let aiJobId: string | null = null;
    const stageKeyTyped = stageKey as EditorialStageKey;
    const workflowStageKey = mapLegacyStageToWorkflowStage(stageKeyTyped);
    const pipelineStageKey = WORKFLOW_STAGE_AI_CONFIG[workflowStageKey]?.aiStageKey;
    const config = pipelineStageKey ? STAGE_CONFIG[pipelineStageKey] : null;

    if (triggerAi && pipelineStageKey && config?.aiTaskKey) {
      const aiTaskKey = config.aiTaskKey as EditorialAiTaskKey;
      if (isTaskAllowedForStage(pipelineStageKey, aiTaskKey)) {
        try {
          // Get the latest file for this project
          const { data: latestFile } = await supabase
            .from("editorial_files")
            .select("id, version")
            .eq("project_id", projectId)
            .order("version", { ascending: false })
            .limit(1)
            .single();

          const result = await requestStageAiAssist({
            orgId: project.org_id,
            projectId,
            stageKey: pipelineStageKey,
            taskKey: aiTaskKey,
            requestedBy: staff.userId,
            sourceFileId: latestFile?.id,
            sourceFileVersion: latestFile?.version,
          });

          aiJobId = result.jobId;

          await logWorkflowEvent({
            orgId: project.org_id,
            projectId,
            stageKey,
            eventType: "ai_task_queued",
            actorId: staff.userId,
            payload: { taskKey: aiTaskKey, jobId: aiJobId },
          });
        } catch (aiError) {
          console.error(`[staff/stages/start] Failed to queue AI task:`, aiError);
          // Don't fail the request if AI task fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      aiJobId,
    });
  } catch (error) {
    console.error("[staff/stages/start] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
