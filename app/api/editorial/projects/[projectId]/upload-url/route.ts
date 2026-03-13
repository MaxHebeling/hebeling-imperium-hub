import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { getEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";

/**
 * POST /api/editorial/projects/[projectId]/upload-url
 *
 * Returns a Supabase signed upload URL so the client can upload
 * directly to storage, bypassing the Vercel 4.5 MB body-size limit.
 *
 * Body: { fileName: string, mimeType: string, sizeBytes: number }
 * Response: { signedUrl, token, storagePath, version }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { fileName, mimeType, sizeBytes } = body as {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    };

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "fileName is required" },
        { status: 400 }
      );
    }

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const supabase = getAdminClient();

    // Auto-increment version
    const latestVersion = await getLatestFileVersion(projectId, "manuscript_original");
    const nextVersion = latestVersion + 1;

    const ext = fileName.split(".").pop() ?? "bin";
    const storagePath = `${projectId}/manuscripts/v${nextVersion}.${ext}`;

    // Create a signed upload URL (valid for 10 minutes)
    const { data, error } = await supabase.storage
      .from(EDITORIAL_BUCKETS.manuscripts)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[upload-url] signed URL error:", error);
      return NextResponse.json(
        { success: false, error: error?.message ?? "Could not create signed URL" },
        { status: 500 }
      );
    }

    // Pre-register the file record so the UI can show it immediately after upload
    const fileRecord = await registerManuscriptFile(
      projectId,
      storagePath,
      mimeType || "application/octet-stream",
      sizeBytes || 0,
      undefined,
      nextVersion,
      "client"
    );

    await logEditorialActivity(projectId, "manuscript_uploaded", {
      stageKey: "ingesta",
      payload: { storagePath, sizeBytes, mimeType, version: nextVersion },
    });

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      version: nextVersion,
      file: fileRecord,
    });
  } catch (error) {
    console.error("[upload-url] error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
