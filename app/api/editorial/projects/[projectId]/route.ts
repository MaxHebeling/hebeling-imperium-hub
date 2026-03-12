import { NextRequest, NextResponse } from "next/server";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { getAdminClient } from "@/lib/leads/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[editorial/project] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    console.info("[editorial/project] DELETE requested", { projectId });

    // Ensure it exists (nicer error than silent success)
    const project = await getEditorialProject(projectId);
    if (!project) {
      console.info("[editorial/project] DELETE not found", { projectId });
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const supabase = getAdminClient();
    const { data: deleted, error } = await supabase
      .from("editorial_projects")
      .delete()
      .eq("id", projectId)
      .select("id");

    if (error) {
      console.error("[editorial/project] DELETE supabase error", { projectId, error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = Array.isArray(deleted) ? deleted.length : 0;
    console.info("[editorial/project] DELETE result", { projectId, deletedCount });

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Delete returned 0 rows." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("[editorial/project] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
