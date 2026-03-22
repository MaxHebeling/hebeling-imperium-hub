import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { listAiFindings } from "@/lib/editorial/ai/findings";
import type {
  EditorialAiFindingSeverity,
  EditorialAiFindingStatus,
  EditorialAiFindingType,
} from "@/lib/editorial/types/ai-findings";

function isFindingStatus(value: string): value is EditorialAiFindingStatus {
  return ["open", "acknowledged", "resolved", "dismissed"].includes(value);
}

function isFindingSeverity(value: string): value is EditorialAiFindingSeverity {
  return ["info", "warning", "critical"].includes(value);
}

function isFindingType(value: string): value is EditorialAiFindingType {
  return ["issue", "recommendation", "flag"].includes(value);
}

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
    const rawStatus = searchParams.get("status");
    const rawSeverity = searchParams.get("severity");
    const rawFindingType = searchParams.get("type");
    const status = rawStatus && isFindingStatus(rawStatus) ? rawStatus : undefined;
    const severity = rawSeverity && isFindingSeverity(rawSeverity) ? rawSeverity : undefined;
    const findingType = rawFindingType && isFindingType(rawFindingType) ? rawFindingType : undefined;

    const findings = await listAiFindings({
      projectId,
      stageKey: stageKey as EditorialStageKey,
      status,
      severity,
      findingType,
      limit: 200,
    });

    return NextResponse.json({ success: true, findings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
