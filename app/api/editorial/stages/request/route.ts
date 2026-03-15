import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject, getProjectStages } from "@/lib/editorial/db/queries";
import { updateStageStatus, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff();
    const body = await request.json();
    const { projectId, stageKey } = body;

    if (!projectId || !stageKey) {
      return NextResponse.json(
        { success: false, error: "projectId and stageKey are required" },
        { status: 400 }
      );
    }

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

    const stages = await getProjectStages(projectId);
    const stage = stages.find((s) => s.stage_key === stageKey);
    if (!stage) {
      return NextResponse.json({ success: false, error: "Stage not found" }, { status: 404 });
    }

    await updateStageStatus(projectId, stageKey, "queued");

    await logEditorialActivity(projectId, "stage_requested", {
      stageKey,
      payload: { previousStatus: stage.status, newStatus: "queued", requestedBy: staff.userId },
    });

    return NextResponse.json({ success: true, stageKey, status: "queued" });
  } catch (error) {
    console.error("[editorial/stages/request] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
