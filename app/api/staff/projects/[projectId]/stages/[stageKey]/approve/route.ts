import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { approveStage, advanceProjectStage, logEditorialActivity, updateStageStatus } from "@/lib/editorial/db/mutations";
import { isValidStageKey, getNextStage } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { evaluateStageCanComplete } from "@/lib/editorial/workflow";
import { initializeNextStage } from "@/lib/editorial/pipeline/stage-transitions";

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/approve
 *
 * Marks a stage as approved (and completed_at) and advances the project stage
 * when the approved stage matches the project's current_stage.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; stageKey: string }> }
) {
  try {
    const staff = await requireStaff();

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

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "stage:approve",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const evaluation = await evaluateStageCanComplete({
      orgId: project.org_id,
      projectId,
      stageKey: stageKey as any, // validated above with isValidStageKey
    });

    if (!evaluation.canComplete) {
      return NextResponse.json(
        {
          success: false,
          error: "Stage cannot be completed",
          reasons: evaluation.reasons,
          checklist: evaluation.checklist,
        },
        { status: 409 }
      );
    }

    // Ensure stage is at least in reviewable state (best-effort).
    await updateStageStatus(projectId, stageKey, "approved");
    await approveStage({ projectId, stageKey, actorId: staff.userId });

    let advancedTo: string | null = null;
    if (project.current_stage === stageKey) {
      const next = getNextStage(stageKey);
      if (next) {
        // Advance project to next stage
        await advanceProjectStage(projectId, next);
        advancedTo = next;
        
        // Initialize the next stage (set started_at, status to pending/processing)
        await initializeNextStage({
          projectId,
          stageKey: next,
          actorId: staff.userId,
        });
      } else {
        // Last stage approved → mark project as completed
        const { getAdminClient } = await import("@/lib/leads/helpers");
        const supabase = getAdminClient();
        await supabase
          .from("editorial_projects")
          .update({ status: "completed", progress_percent: 100 })
          .eq("id", projectId);
      }
    }

    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      stageKey,
      eventType: "stage_completed",
      actorId: staff.userId,
      actorRole: staff.role,
      payload: { via: "approve_endpoint", advancedTo },
    });
    if (advancedTo && isValidStageKey(advancedTo)) {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey: advancedTo,
        eventType: "stage_started",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: { via: "auto_advance", fromStage: stageKey },
      });
    }

    await logEditorialActivity(projectId, "stage_approved_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { advancedTo },
    });

    return NextResponse.json({ success: true, advancedTo });
  } catch (error) {
    console.error("[staff/stages/approve] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

