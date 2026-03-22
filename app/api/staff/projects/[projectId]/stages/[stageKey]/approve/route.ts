import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import {
  advanceProjectStage,
  approveStage,
  logEditorialActivity,
  updateStageStatus,
} from "@/lib/editorial/db/mutations";
import { getNextStage, isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { evaluateStageCanComplete } from "@/lib/editorial/workflow";
import {
  getActiveStageRun,
  mapLegacyStageToWorkflowStage,
  updateStageRunStatus,
} from "@/lib/editorial/stage-engine/service";

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
      stageKey,
    });

    if (!evaluation.canComplete) {
      return NextResponse.json(
        {
          success: false,
          error: "La etapa aun no cumple los gates de salida.",
          reasons: evaluation.reasons,
          checklist: evaluation.checklist,
        },
        { status: 409 }
      );
    }

    await approveStage({ projectId, stageKey, actorId: staff.userId });

    const workflowStageKey = mapLegacyStageToWorkflowStage(stageKey);
    const activeStageRun = await getActiveStageRun(projectId, workflowStageKey);
    if (activeStageRun) {
      await updateStageRunStatus({
        stageRunId: activeStageRun.id,
        status: "approved",
      });

      const supabase = getAdminClient();
      await supabase.from("editorial_approvals_v2").insert({
        project_id: projectId,
        stage_run_id: activeStageRun.id,
        approval_type: "stage_gate",
        decision: "approved",
        approved_by: staff.userId,
        notes: `Stage ${stageKey} approved by staff`,
      });
    }

    let advancedTo: string | null = null;
    if (project.current_stage === stageKey) {
      const nextStage = getNextStage(stageKey);

      if (nextStage) {
        await advanceProjectStage(projectId, nextStage);
        await updateStageStatus(projectId, nextStage, "pending");
        advancedTo = nextStage;
      } else {
        const supabase = getAdminClient();
        await supabase
          .from("editorial_projects")
          .update({
            status: "completed",
            progress_percent: 100,
            project_status_v2: "published",
            updated_at: new Date().toISOString(),
          })
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
      payload: { via: "approve_endpoint_v2", advancedTo },
    });

    if (advancedTo && isValidStageKey(advancedTo)) {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey: advancedTo,
        eventType: "stage_started",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: { via: "approve_endpoint_v2", fromStage: stageKey },
      });
    }

    await logEditorialActivity(projectId, "stage_approved_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { advancedTo, workflowStageKey },
    });

    return NextResponse.json({
      success: true,
      advancedTo,
      workflowStageKey,
      approvedRun: activeStageRun?.id ?? null,
    });
  } catch (error) {
    console.error("[staff/stages/approve] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
