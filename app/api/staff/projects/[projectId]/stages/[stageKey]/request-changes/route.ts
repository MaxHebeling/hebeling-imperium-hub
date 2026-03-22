import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { logEditorialActivity, updateStageStatus } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { getActiveStageRun, mapLegacyStageToWorkflowStage, updateStageRunStatus } from "@/lib/editorial/stage-engine/service";

export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return NextResponse.json(
        { success: false, error: "Debes indicar que cambios necesitas antes de devolver la etapa." },
        { status: 400 }
      );
    }

    const workflowStageKey = mapLegacyStageToWorkflowStage(stageKey);
    const activeStageRun = await getActiveStageRun(projectId, workflowStageKey);
    if (!activeStageRun) {
      return NextResponse.json(
        { success: false, error: "No active stage run found for this stage" },
        { status: 404 }
      );
    }

    await updateStageRunStatus({
      stageRunId: activeStageRun.id,
      status: "changes_requested",
      aiSummary: activeStageRun.ai_summary ?? undefined,
      qualityScore: activeStageRun.quality_score ?? undefined,
    });

    await updateStageStatus(projectId, stageKey, "pending");

    const supabase = getAdminClient();
    await supabase.from("editorial_approvals_v2").insert({
      project_id: projectId,
      stage_run_id: activeStageRun.id,
      approval_type: "stage_gate",
      decision: "changes_requested",
      approved_by: staff.userId,
      notes,
    });

    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      stageKey,
      eventType: "stage_reopened",
      actorId: staff.userId,
      actorRole: staff.role,
      payload: { via: "request_changes_endpoint", notes: notes || null },
    });

    await logEditorialActivity(projectId, "stage_changes_requested_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { notes, workflowStageKey },
    });

    return NextResponse.json({
      success: true,
      stageRunId: activeStageRun.id,
      workflowStageKey,
      message: "La etapa quedo marcada con cambios solicitados.",
    });
  } catch (error) {
    console.error("[staff/stages/request-changes] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
