import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { listSuggestionsForFile } from "@/lib/editorial/ai/suggestions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const taskKey = searchParams.get("taskKey") ?? undefined;
    const status = searchParams.get("status");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "fileId es requerido" },
        { status: 400 }
      );
    }

    const suggestions = await listSuggestionsForFile({
      projectId,
      fileId,
      taskKey: taskKey as any,
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

