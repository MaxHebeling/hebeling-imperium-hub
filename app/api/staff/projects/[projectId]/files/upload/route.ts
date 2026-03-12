import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject, getLatestFileVersion } from "@/lib/editorial/db/queries";
import { uploadEditorialFile } from "@/lib/editorial/storage/upload";
import { registerEditorialFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import type { EditorialFileVisibility, EditorialStageKey } from "@/lib/editorial/types/editorial";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { getAdminClient } from "@/lib/leads/helpers";

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
    console.info("[upload-debug] staff resolved", {
      userId: staff.userId,
      role: staff.role,
    });

    const { projectId } = await params;
    console.info("[upload-debug] request context", {
      projectId,
      staffUserId: staff.userId,
      staffRole: staff.role,
      method: request.method,
      contentType: request.headers.get("content-type"),
    });

    console.info("[upload-debug] project lookup start", { projectId });
    const project = await getEditorialProject(projectId);
    console.info("[upload-debug] project lookup result", {
      projectId,
      found: !!project,
      orgId: project?.org_id ?? null,
    });
    if (!project) {
      console.info("[upload-debug] 404 FORBIDDEN_PROJECT (not found)", {
        projectId,
        staffUserId: staff.userId,
      });
      return NextResponse.json(
        { success: false, error: "FORBIDDEN_PROJECT: Project not found" },
        { status: 404 }
      );
    }

    // Debug membership / staff assignment for this project
    const admin = getAdminClient();
    console.info("[upload-debug] admin membership check start", {
      projectId,
      staffUserId: staff.userId,
    });
    const { data: membership, error: membershipError } = await admin
      .from("editorial_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", staff.userId);
    console.info("[upload-debug] admin membership check result", {
      projectId,
      staffUserId: staff.userId,
      membership,
      membershipError,
    });

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "files:upload",
    });
    if (!decision.allowed) {
      // Allow hard override for org-level superadmin while we debug capabilities.
      if (staff.role === "superadmin") {
        console.info("[editorial-files][upload] OVERRIDE files:upload for superadmin", {
          projectId,
          orgId: project.org_id,
          userId: staff.userId,
          staffRole: staff.role,
          required: "files:upload",
          effectiveCapabilities: decision.effectiveCapabilities,
          reason: decision.reason,
        });
      } else {
        console.info("[upload-debug] 403 FORBIDDEN_ROLE_CAPABILITY", {
          projectId,
          orgId: project.org_id,
          userId: staff.userId,
          required: "files:upload",
          effectiveCapabilities: decision.effectiveCapabilities,
          reason: decision.reason,
        });
        return NextResponse.json(
          {
            success: false,
            error: `FORBIDDEN_ROLE: ${decision.reason ?? "missing files:upload capability"}`,
          },
          { status: 403 }
        );
      }
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

    console.info("[upload-debug] before storage upload", {
      projectId,
      fileType,
      stageKey,
      nextVersion,
      fileName: file.name,
      fileSize: file.size,
      fileTypeHeader: file.type,
    });

    const upload = await uploadEditorialFile(projectId, file, {
      fileType,
      stageKey,
      version: nextVersion,
    });
    console.info("[upload-debug] storage upload result", {
      bucket: upload.bucket,
      storagePath: upload.storagePath,
      sizeBytes: upload.sizeBytes,
      mimeType: upload.mimeType,
      version: upload.version,
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
    console.error("[upload-debug] catch error in staff/files/upload:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;
    const errorCode =
      status === 401
        ? "FORBIDDEN_USER"
        : status === 403
          ? "FORBIDDEN_STORAGE"
          : "INTERNAL_ERROR";
    console.error("[upload-debug] mapped error", { status, errorCode, message });
    return NextResponse.json({ success: false, error: `${errorCode}: ${message}` }, { status });
  }
}

