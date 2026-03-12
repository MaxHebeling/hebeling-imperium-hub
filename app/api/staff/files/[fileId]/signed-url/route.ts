import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialFile, getEditorialProject } from "@/lib/editorial/db/queries";
import { getSignedUrl } from "@/lib/editorial/storage/signed-url";
import { bucketKeyForFileType } from "@/lib/editorial/storage/upload";
import { requireEditorialCapability } from "@/lib/editorial/permissions";

/**
 * GET /api/staff/files/[fileId]/signed-url
 * Returns a short-lived signed URL for the file.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { fileId } = await params;
    const file = await getEditorialFile(fileId);
    if (!file) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const project = await getEditorialProject(file.project_id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    const decision = await requireEditorialCapability({
      projectId: project.id,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "files:read",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const bucketKey = bucketKeyForFileType(file.file_type);
    const signedUrl = await getSignedUrl(bucketKey, file.storage_path, 60 * 20);
    return NextResponse.json({ success: true, signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

