import { NextRequest, NextResponse } from "next/server";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { getEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    // Determine next version so we never overwrite an existing upload
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
      undefined,
      version,
      "client" // staff uploads of manuscripts are also visible to the client
    );

    await logEditorialActivity(projectId, "manuscript_uploaded", {
      stageKey: "ingesta",
      payload: { storagePath, sizeBytes, mimeType, version },
    });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("[editorial/upload] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
