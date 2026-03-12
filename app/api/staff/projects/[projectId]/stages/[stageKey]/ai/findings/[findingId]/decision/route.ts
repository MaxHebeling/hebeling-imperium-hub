import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiFindingDecisionStatus } from "@/lib/editorial/types/ai-review";
import { recordAiFindingDecision } from "@/lib/editorial/ai/review";
import { updateAiFindingStatus } from "@/lib/editorial/ai/findings";
import { getAdminClient } from "@/lib/leads/helpers";

function mapDecisionToFindingStatus(
  decisionStatus: EditorialAiFindingDecisionStatus
): "open" | "acknowledged" | "resolved" | "dismissed" {
  switch (decisionStatus) {
    case "accepted":
      return "acknowledged";
    case "rejected":
      return "dismissed";
    case "resolved":
    case "applied_manually":
      return "resolved";
    case "pending_review":
    default:
      return "open";
  }
}

function isDecisionStatus(value: string): value is EditorialAiFindingDecisionStatus {
  return [
    "pending_review",
    "accepted",
    "rejected",
    "resolved",
    "applied_manually",
  ].includes(value);
}

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/ai/findings/[findingId]/decision
 * Body: { decisionStatus, comment? }
 *
 * Records a human decision about an AI finding and updates the finding status accordingly.
 * Does NOT apply editorial changes or bypass workflow governance.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; stageKey: string; findingId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId, stageKey, findingId } = await params;

    if (!isValidStageKey(stageKey)) {
      return NextResponse.json({ success: false, error: `Invalid stageKey: ${stageKey}` }, { status: 400 });
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const decisionCapability = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
    capability: "ai:review",
    });
    if (!decisionCapability.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const rawStatus = String(body?.decisionStatus ?? "").trim();
    if (!isDecisionStatus(rawStatus)) {
      return NextResponse.json({ success: false, error: "Invalid decisionStatus" }, { status: 400 });
    }
    const comment = body?.comment ? String(body.comment) : null;

    // Load finding to validate project/org scoping.
    const supabase = getAdminClient();
    const { data: finding, error } = await supabase
      .from("editorial_ai_findings")
      .select("id, project_id, stage_key")
      .eq("id", findingId)
      .single();

    if (error || !finding) {
      return NextResponse.json({ success: false, error: "Finding not found" }, { status: 404 });
    }

    if (finding.project_id !== projectId) {
      return NextResponse.json({ success: false, error: "Finding does not belong to this project" }, { status: 400 });
    }

    const normalizedStageKey = (finding.stage_key as EditorialStageKey | null) ?? (stageKey as EditorialStageKey);

    const decision = await recordAiFindingDecision({
      orgId: project.org_id,
      projectId,
      stageKey: normalizedStageKey,
      findingId,
      decisionStatus: rawStatus,
      decisionComment: comment,
      decidedBy: staff.userId,
    });

    const newFindingStatus = mapDecisionToFindingStatus(rawStatus);
    await updateAiFindingStatus({
      findingId,
      status: newFindingStatus,
      updatedBy: staff.userId,
    });

    return NextResponse.json({
      success: true,
      decision,
      findingStatus: newFindingStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

