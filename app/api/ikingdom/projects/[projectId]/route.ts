import { NextRequest, NextResponse } from "next/server";
import { requireIKingdomStaffAccess } from "@/lib/ikingdom/route-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const access = await requireIKingdomStaffAccess();
    if (!access.ok) {
      return access.response;
    }

    const { projectId } = await params;
    const { data: project, error: projectError } = await access.admin
      .from("ikingdom_web_projects")
      .select("id, org_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.org_id !== access.orgId) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Delete stages first (FK)
    await access.admin
      .from("ikingdom_web_stages")
      .delete()
      .eq("project_id", projectId);

    // Delete files
    await access.admin
      .from("ikingdom_web_files")
      .delete()
      .eq("project_id", projectId);

    // Delete deliverables
    await access.admin
      .from("ikingdom_web_deliverables")
      .delete()
      .eq("project_id", projectId);

    // Delete the project
    const { error } = await access.admin
      .from("ikingdom_web_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ikingdom/delete] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
