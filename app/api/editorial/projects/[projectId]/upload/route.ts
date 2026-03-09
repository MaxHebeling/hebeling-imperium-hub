import { NextRequest, NextResponse } from "next/server";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { getEditorialProject } from "@/lib/editorial/db/queries";

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

    const { storagePath, sizeBytes, mimeType } = await uploadManuscript(projectId, file);

    const fileRecord = await registerManuscriptFile(
      projectId,
      storagePath,
      mimeType,
      sizeBytes
    );

    await logEditorialActivity(projectId, "manuscript_uploaded", {
      stageKey: "ingesta",
      payload: { storagePath, sizeBytes, mimeType },
    });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("[editorial/upload] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
