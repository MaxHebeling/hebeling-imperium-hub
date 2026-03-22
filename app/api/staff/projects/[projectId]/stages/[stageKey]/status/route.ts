import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { logEditorialActivity, updateStageStatus } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { evaluateStageCanComplete } from "@/lib/editorial/workflow";

const ALLOWED_STATUSES = [
  "pending",
  "queued",
  "processing",
  "review_required",
  "approved",
  "failed",
  "completed",
] as const;

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/status
 * Body JSON: { status: oneOf(ALLOWED_STATUSES) }
 */
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

    const body = await request.json();
    const status = String(body?.status ?? "");
    if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const isCompletionLike = status === "approved" || status === "completed";
    if (isCompletionLike && project.current_stage === stageKey) {
      const evaluation = await evaluateStageCanComplete({
        orgId: project.org_id,
        projectId,
        stageKey,
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
    }

    const isReopenLike = status === "pending" || status === "queued";
    const capability = isReopenLike ? "stage:reopen" : "stage:update_status";
    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability,
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await updateStageStatus(projectId, stageKey, status);

    if (status === "processing") {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey,
        eventType: "stage_started",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: { via: "status_endpoint", status },
      });
    } else if (status === "approved" || status === "completed") {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey,
        eventType: "stage_completed",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: { via: "status_endpoint", status },
      });
    } else if (isReopenLike) {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey,
        eventType: "stage_reopened",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: { via: "status_endpoint", status },
      });
    }

    await logEditorialActivity(projectId, "stage_status_updated_by_staff", {
      stageKey,
      actorId: staff.userId,
      actorType: "staff",
      payload: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
