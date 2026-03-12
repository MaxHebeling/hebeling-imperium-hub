import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * DELETE /api/staff/files/[fileId]
 * Deletes a file record and removes it from storage
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { fileId } = await params;

    const supabase = getAdminClient();

    // Get file info first
    const { data: file, error: fileError } = await supabase
      .from("editorial_files")
      .select("id, storage_path, project_id")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Delete from storage bucket
    if (file.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("editorial-manuscripts")
        .remove([file.storage_path]);

      if (storageError) {
        console.error("[delete-file] Storage delete error:", storageError);
        // Continue anyway - the DB record should still be deleted
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("editorial_files")
      .delete()
      .eq("id", fileId);

    if (deleteError) {
      console.error("[delete-file] DB delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete file record" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("editorial_activity_log").insert({
      project_id: file.project_id,
      event_type: "file_deleted",
      actor_id: staff.userId,
      actor_type: "staff",
      payload: { fileId, storagePath: file.storage_path },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[delete-file] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
