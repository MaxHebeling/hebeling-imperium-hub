import { deleteEditorialProject } from "@/lib/editorial/db/mutations";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    console.log("[v0] DELETE route called with projectId:", projectId);

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    console.log("[v0] Calling deleteEditorialProject...");
    await deleteEditorialProject(projectId);
    console.log("[v0] Project deleted successfully");

    return NextResponse.json(
      { success: true, message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Failed to delete project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project" },
      { status: 500 }
    );
  }
}
