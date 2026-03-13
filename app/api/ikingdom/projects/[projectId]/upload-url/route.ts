import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * POST /api/ikingdom/projects/[projectId]/upload-url
 *
 * Returns a Supabase signed upload URL so the client can upload
 * directly to storage, bypassing the Vercel 4.5 MB body-size limit.
 *
 * Body: { fileName: string, mimeType: string, sizeBytes: number, stageKey?: string }
 * Response: { signedUrl, storagePath }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { fileName, mimeType, sizeBytes, stageKey } = body as {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      stageKey?: string;
    };

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "fileName es requerido" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("ikingdom_web_projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const ext = fileName.split(".").pop() ?? "bin";
    const timestamp = Date.now();
    const storagePath = `${projectId}/${stageKey ?? "general"}/${timestamp}.${ext}`;

    // Create a signed upload URL (valid for 10 minutes)
    const { data, error } = await supabase.storage
      .from("ikingdom-files")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[ikingdom/upload-url] signed URL error:", error);
      return NextResponse.json(
        { success: false, error: error?.message ?? "No se pudo crear la URL de subida" },
        { status: 500 }
      );
    }

    // Register file record in the database
    await supabase.from("ikingdom_web_files").insert({
      project_id: projectId,
      stage_key: stageKey || null,
      file_type: "deliverable",
      file_name: fileName,
      storage_path: storagePath,
      mime_type: mimeType || "application/octet-stream",
      size_bytes: sizeBytes || 0,
    });

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      storagePath,
    });
  } catch (error) {
    console.error("[ikingdom/upload-url] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
