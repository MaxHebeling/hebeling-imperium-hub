import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { listAiFindings } from "@/lib/editorial/ai/findings";

/**
 * GET /api/staff/projects/[projectId]/stages/[stageKey]/ai/findings
 * Query: status?, severity?, type?
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; stageKey: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId, stageKey } = await params;

    if (!isValidStageKey(stageKey)) {
      return NextResponse.json({ success: false, error: `Invalid stageKey: ${stageKey}` }, { status: 400 });
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "files:read",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const severity = searchParams.get("severity") ?? undefined;
    const findingType = searchParams.get("type") ?? undefined;

    const findings = await listAiFindings({
      projectId,
      stageKey: stageKey as EditorialStageKey,
      status: status as any,
      severity: severity as any,
      findingType: findingType as any,
      limit: 200,
    });

    return NextResponse.json({ success: true, findings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

