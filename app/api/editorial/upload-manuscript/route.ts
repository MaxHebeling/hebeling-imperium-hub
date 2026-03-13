import { NextResponse } from "next/server";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { registerManuscriptFile } from "@/lib/editorial/db/mutations";
import { getAdminClient } from "@/lib/leads/helpers";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (matches component limit)
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".epub", ".txt"]);
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/epub+zip",
  "text/plain",
]);

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "El archivo supera el tamaño máximo de 100MB.";
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_TYPES.has(file.type)) {
    return `Formato no soportado. Formatos aceptados: ${[...ALLOWED_EXTENSIONS].join(", ")}`;
  }
  return null;
}

/**
 * Upload a manuscript file to an existing editorial project.
 * Used by the ReinoEditorialManuscriptUpload component.
 *
 * Expects FormData with:
 *   - file: the manuscript file
 *   - projectId: UUID of the existing project
 *   - fileType: e.g. "manuscript_original"
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string)?.trim();
    const fileType = (formData.get("fileType") as string)?.trim() || "manuscript_original";

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

    const fileError = validateFile(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // Verify the project exists
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

    // Determine the next version by checking existing manuscript files
    const { data: existingFiles } = await supabase
      .from("editorial_files")
      .select("version")
      .eq("project_id", projectId)
      .like("file_type", "manuscript%")
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existingFiles?.[0]?.version ?? 0) + 1;

    // Upload to Supabase Storage
    const uploadResult = await uploadManuscript(projectId, file, nextVersion);

    // Register in the database
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
  } catch (err) {
    console.error("[upload-manuscript] error:", err);
    const message = err instanceof Error ? err.message : "Error al subir el manuscrito.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
