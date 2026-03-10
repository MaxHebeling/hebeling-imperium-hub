import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";
import { uploadEditorialFile } from "@/lib/editorial/storage/upload";
import { registerEditorialFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import type { EditorialFileVisibility, EditorialStageKey } from "@/lib/editorial/types/editorial";
import { requireEditorialCapability } from "@/lib/editorial/permissions";

const FILETYPE_ALLOWLIST: Record<
  string,
  { mimes: string[]; extensions: string[] }
> = {
  manuscript_original: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ],
    extensions: ["pdf", "doc", "docx", "txt", "md"],
  },
  manuscript_edited: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ],
    extensions: ["pdf", "doc", "docx", "txt", "md"],
  },
  working_file: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ],
    extensions: ["pdf", "doc", "docx", "txt", "md"],
  },
  cover_draft: {
    mimes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: ["pdf", "png", "jpg", "jpeg"],
  },
  export_pdf: {
    mimes: ["application/pdf"],
    extensions: ["pdf"],
  },
};

function getExt(name: string): string {
  const part = name.split(".").pop() ?? "";
  return part.toLowerCase();
}

/**
 * POST /api/staff/projects/[projectId]/files/upload
 *
 * Staff upload endpoint (service role behind the scenes).
 * Accepts multipart/form-data:
 * - file (File) [required]
 * - fileType (string) [required]
 * - stageKey (string) [optional]
 * - visibility (internal|client|public) [required]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();

    const { projectId } = await params;
    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "files:upload",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const fileType = String(formData.get("fileType") ?? "");
    const stageKeyRaw = formData.get("stageKey");
    const visibilityRaw = String(formData.get("visibility") ?? "");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    // Upload validation (Phase 3B)
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "Archivo demasiado grande (máx. 25 MB)." },
        { status: 400 }
      );
    }
    if (!fileType.trim()) {
      return NextResponse.json({ success: false, error: "fileType is required" }, { status: 400 });
    }

    // Strict allowlist for fileType + MIME (Phase 3B close)
    const spec = FILETYPE_ALLOWLIST[fileType];
    if (!spec) {
      return NextResponse.json(
        {
          success: false,
          error: `fileType no soportado: ${fileType}`,
        },
        { status: 400 }
      );
    }
    const ext = getExt(file.name);
    if (ext && !spec.extensions.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Extensión no soportada para ${fileType}: .${ext}`,
        },
        { status: 400 }
      );
    }
    if (file.type && !spec.mimes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `MIME no soportado para ${fileType}: ${file.type}`,
        },
        { status: 400 }
      );
    }
    if (!visibilityRaw) {
      return NextResponse.json({ success: false, error: "visibility is required" }, { status: 400 });
    }

    const visibility = visibilityRaw as EditorialFileVisibility;
    if (!["internal", "client", "public"].includes(visibility)) {
      return NextResponse.json({ success: false, error: "Invalid visibility" }, { status: 400 });
    }

    const stageKey =
      typeof stageKeyRaw === "string" && stageKeyRaw.trim()
        ? stageKeyRaw.trim()
        : null;
    if (stageKey && !isValidStageKey(stageKey)) {
      return NextResponse.json(
        { success: false, error: `Invalid stageKey: ${stageKey}` },
        { status: 400 }
      );
    }

    const latestVersion = await getLatestFileVersion(projectId, fileType);
    const nextVersion = latestVersion + 1;

    const upload = await uploadEditorialFile(projectId, file, {
      fileType,
      stageKey,
      version: nextVersion,
    });

    const record = await registerEditorialFile({
      projectId,
      stageKey: stageKey as EditorialStageKey | null,
      fileType,
      version: upload.version,
      storagePath: upload.storagePath,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      uploadedBy: staff.userId,
      visibility,
    });

    await logEditorialActivity(projectId, "file_uploaded_by_staff", {
      stageKey: stageKey ?? undefined,
      actorId: staff.userId,
      actorType: "staff",
      payload: {
        fileType,
        version: upload.version,
        storagePath: upload.storagePath,
        visibility,
        bucket: upload.bucket,
      },
    });

    return NextResponse.json({ success: true, file: record });
  } catch (error) {
    console.error("[staff/files/upload] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

