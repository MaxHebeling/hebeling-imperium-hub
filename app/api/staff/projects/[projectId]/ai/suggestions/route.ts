import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { listSuggestionsForFile } from "@/lib/editorial/ai/suggestions";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

function isEditorialAiTaskKey(value: string): value is EditorialAiTaskKey {
  return [
    "manuscript_analysis",
    "structure_analysis",
    "style_suggestions",
    "orthotypography_review",
    "issue_detection",
    "quality_scoring",
    "redline_diff",
    "layout_analysis",
    "typography_check",
    "page_flow_review",
    "export_validation",
    "metadata_generation",
    "line_editing",
    "copyediting",
    "concept_review",
  ].includes(value);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireStaff();
    const { projectId } = await params;

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const rawTaskKey = searchParams.get("taskKey");
    const status = searchParams.get("status");
    const taskKey = rawTaskKey && isEditorialAiTaskKey(rawTaskKey) ? rawTaskKey : undefined;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "fileId es requerido" },
        { status: 400 }
      );
    }

    const suggestions = await listSuggestionsForFile({
      projectId,
      fileId,
      taskKey,
      onlyPending: status === "pending",
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("[editorial-ai][suggestions] GET error", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
