import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = getAdminClient();

    // Delete stages first (FK)
    await supabase
      .from("ikingdom_web_stages")
      .delete()
      .eq("project_id", projectId);

    // Delete files
    await supabase
      .from("ikingdom_web_files")
      .delete()
      .eq("project_id", projectId);

    // Delete deliverables
    await supabase
      .from("ikingdom_web_deliverables")
      .delete()
      .eq("project_id", projectId);

    // Delete the project
    const { error } = await supabase
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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
