import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { getClientEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { ensureEditorialBucket } from "@/lib/editorial/storage/provision";

/**
 * POST /api/editorial/client/projects/[projectId]/upload-url
 *
 * Returns a Supabase signed upload URL so the client browser can upload
 * directly to storage, bypassing the Vercel 4.5 MB body-size limit.
 *
 * Body: { fileName: string, mimeType: string, sizeBytes: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Auth check – client must be logged in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Ownership check
    const project = await getClientEditorialProject(projectId, user.id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

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

    const admin = getAdminClient();
    await ensureEditorialBucket(EDITORIAL_BUCKETS.manuscripts);

    // Auto-increment version
    const latestVersion = await getLatestFileVersion(projectId, "manuscript_original");
    const nextVersion = latestVersion + 1;

    const ext = fileName.split(".").pop() ?? "bin";
    const storagePath = `${projectId}/manuscripts/v${nextVersion}.${ext}`;

    // Create a signed upload URL (valid for 10 minutes)
    const { data, error } = await admin.storage
      .from(EDITORIAL_BUCKETS.manuscripts)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[client/upload-url] signed URL error:", error);
      return NextResponse.json(
        { success: false, error: error?.message ?? "Could not create signed URL" },
        { status: 500 }
      );
    }

    // Pre-register the file so it shows up immediately after upload completes
    const fileRecord = await registerManuscriptFile(
      projectId,
      storagePath,
      mimeType || "application/octet-stream",
      sizeBytes || 0,
      user.id,
      nextVersion,
      "client"
    );

    await logEditorialActivity(projectId, "manuscript_uploaded_by_client", {
      stageKey: "ingesta",
      actorId: user.id,
      actorType: "client",
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
    console.error("[client/upload-url] error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
