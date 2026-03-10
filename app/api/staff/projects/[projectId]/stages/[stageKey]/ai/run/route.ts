import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import { requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";

function isAiTaskKey(value: string): value is EditorialAiTaskKey {
  return [
    "structure_analysis",
    "style_suggestions",
    "orthotypography_review",
    "issue_detection",
    "quality_scoring",
    "redline_diff",
  ].includes(value);
}

/**
 * POST /api/staff/projects/[projectId]/stages/[stageKey]/ai/run
 * Body: { taskKey, sourceFileId?, sourceFileVersion? }
 *
 * Creates an AI job (queued) for the given project+stage+task.
 * Human review remains mandatory; no auto-apply.
 */
export async function POST(
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
    capability: "ai:run",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const taskKeyRaw = String(body?.taskKey ?? "").trim();
    if (!isAiTaskKey(taskKeyRaw)) {
      return NextResponse.json({ success: false, error: "Invalid taskKey" }, { status: 400 });
    }

    const sourceFileId = body?.sourceFileId ? String(body.sourceFileId) : undefined;
    const sourceFileVersion =
      body?.sourceFileVersion !== undefined && body?.sourceFileVersion !== null
        ? Number(body.sourceFileVersion)
        : undefined;

    const result = await requestStageAiAssist({
      orgId: project.org_id,
      projectId,
      stageKey: stageKey as EditorialStageKey,
      taskKey: taskKeyRaw,
      requestedBy: staff.userId,
      sourceFileId,
      sourceFileVersion,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      promptTemplateId: result.promptTemplateId,
      promptTemplateVersion: result.promptTemplateVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INVALID_AI_TASK_FOR_STAGE" ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

