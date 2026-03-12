import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";

/**
 * POST /api/editorial/client/projects/[projectId]/upload
 * Allows an authenticated client to upload a new manuscript version.
 * - Verifies project ownership before accepting the file.
 * - Auto-increments the version number so previous uploads are preserved.
 * - File is stored as visibility = 'client' (visible to the author and staff).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Ownership check – client can only upload to their own project
    const project = await getClientEditorialProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    // Determine next version (never overwrite existing uploads)
    const latestVersion = await getLatestFileVersion(projectId, "manuscript_original");
    const nextVersion = latestVersion + 1;

    const { storagePath, sizeBytes, mimeType, version } = await uploadManuscript(
      projectId,
      file,
      nextVersion
    );

    const fileRecord = await registerManuscriptFile(
      projectId,
      storagePath,
      mimeType,
      sizeBytes,
      user.id,
      version,
      "client" // client-uploaded manuscripts are visible to both client and staff
    );

    await logEditorialActivity(projectId, "manuscript_uploaded_by_client", {
      stageKey: "ingesta",
      actorId: user.id,
      actorType: "client",
      payload: { storagePath, sizeBytes, mimeType, version },
    });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("[editorial/client/upload] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
