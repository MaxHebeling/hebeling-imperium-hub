import { NextResponse } from "next/server";
import { registerManuscriptFile } from "@/lib/editorial/db/mutations";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { ensureEditorialBucket } from "@/lib/editorial/storage/provision";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".epub", ".txt"]);

function validateExtension(fileName: string): string | null {
  const ext = "." + (fileName.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `Formato no soportado. Formatos aceptados: ${[...ALLOWED_EXTENSIONS].join(", ")}`;
  }
  return null;
}

/**
 * POST /api/editorial/upload-manuscript
 *
 * Supports two modes via JSON body:
 *
 * 1. **presign** - Returns a signed upload URL so the client can upload the
 *    file directly to Supabase Storage (bypasses Vercel 4.5 MB body limit).
 *    Body: { action: "presign", projectId, fileName, fileSize, mimeType }
 *
 * 2. **register** - After the client has uploaded the file via the signed URL,
 *    call this to create the `editorial_files` database record.
 *    Body: { action: "register", projectId, storagePath, mimeType, sizeBytes, version }
 *
 * Legacy: If the request contains FormData (no `action` field) the route falls
 * back to the original server-side upload flow for small files.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // JSON body (presign / register)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { action } = body;

      if (action === "presign") {
        return handlePresign(body);
      }
      if (action === "register") {
        return handleRegister(body);
      }
      return NextResponse.json(
        { error: "Acción no válida. Use 'presign' o 'register'." },
        { status: 400 }
      );
    }

    // FormData body (legacy server-side upload for small files)
    return handleLegacyUpload(request);
  } catch (err) {
    console.error("[upload-manuscript] error:", err);
    const message =
      err instanceof Error ? err.message : "Error al subir el manuscrito.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Presign ───────────────────────────────────────────────────────────
async function handlePresign(body: {
  projectId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}) {
  const { projectId, fileName, fileSize, mimeType } = body;

  if (!projectId?.trim()) {
    return NextResponse.json(
      { error: "projectId es requerido." },
      { status: 400 }
    );
  }
  if (!fileName?.trim()) {
    return NextResponse.json(
      { error: "fileName es requerido." },
      { status: 400 }
    );
  }

  const extError = validateExtension(fileName);
  if (extError) {
    return NextResponse.json({ error: extError }, { status: 400 });
  }
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "El archivo supera el tamaño máximo de 100 MB." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  await ensureEditorialBucket(EDITORIAL_BUCKETS.manuscripts);

  // Verify the project exists
  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id")
    .eq("id", projectId.trim())
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Proyecto no encontrado." },
      { status: 404 }
    );
  }

  // Determine the next version
  const { data: existingFiles } = await supabase
    .from("editorial_files")
    .select("version")
    .eq("project_id", projectId.trim())
    .like("file_type", "manuscript%")
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existingFiles?.[0]?.version ?? 0) + 1;

  const ext = fileName.split(".").pop() ?? "bin";
  const storagePath = `${projectId.trim()}/manuscripts/v${nextVersion}.${ext}`;

  // Create a signed upload URL (valid for 10 minutes)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .createSignedUploadUrl(storagePath);

  if (signedError || !signedData) {
    console.error("[upload-manuscript] signed URL error:", signedError);
    return NextResponse.json(
      { error: "No se pudo generar la URL de subida." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    token: signedData.token,
    storagePath,
    version: nextVersion,
    bucket: EDITORIAL_BUCKETS.manuscripts,
    mimeType: mimeType ?? "application/octet-stream",
  });
}

// ── Register ──────────────────────────────────────────────────────────
async function handleRegister(body: {
  projectId?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  version?: number;
}) {
  const { projectId, storagePath, mimeType, sizeBytes, version } = body;

  if (!projectId?.trim() || !storagePath?.trim()) {
    return NextResponse.json(
      { error: "projectId y storagePath son requeridos." },
      { status: 400 }
    );
  }

  const fileRecord = await registerManuscriptFile(
    projectId.trim(),
    storagePath.trim(),
    mimeType ?? "application/octet-stream",
    sizeBytes ?? 0,
    undefined,
    version ?? 1,
    "client"
  );

  return NextResponse.json({
    success: true,
    fileId: fileRecord.id,
    path: storagePath.trim(),
    version: version ?? 1,
  });
}

// ── Legacy (FormData server-side upload for small files) ──────────────
async function handleLegacyUpload(request: Request) {
  const { uploadManuscript } = await import("@/lib/editorial/storage/upload");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = (formData.get("projectId") as string)?.trim();

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId es requerido." },
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Se requiere un archivo de manuscrito." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "El archivo supera el tamaño máximo de 100 MB." },
      { status: 400 }
    );
  }

  const extError = validateExtension(file.name);
  if (extError) {
    return NextResponse.json({ error: extError }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Proyecto no encontrado." },
      { status: 404 }
    );
  }

  const { data: existingFiles } = await supabase
    .from("editorial_files")
    .select("version")
    .eq("project_id", projectId)
    .like("file_type", "manuscript%")
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existingFiles?.[0]?.version ?? 0) + 1;

  const uploadResult = await uploadManuscript(projectId, file, nextVersion);

  const fileRecord = await registerManuscriptFile(
    projectId,
    uploadResult.storagePath,
    uploadResult.mimeType,
    uploadResult.sizeBytes,
    undefined,
    nextVersion,
    "client"
  );

  return NextResponse.json({
    success: true,
    fileId: fileRecord.id,
    path: uploadResult.storagePath,
    version: nextVersion,
  });
}
