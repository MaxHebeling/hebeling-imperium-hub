import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; exportId: string }> }
) {
  try {
    const { projectId, exportId } = await params;
    const supabase = getAdminClient();

    // Get the author token from cookies
    const cookieStore = await cookies();
    const authorToken = cookieStore.get("author_token")?.value;

    if (!authorToken) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verify author has access to this project
    const { data: member } = await supabase
      .from("editorial_project_members")
      .select("role, user_id")
      .eq("project_id", projectId)
      .eq("access_token", authorToken)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "No tienes acceso a este proyecto" },
        { status: 403 }
      );
    }

    // Get the export record
    const { data: exportRecord, error: exportError } = await supabase
      .from("editorial_exports")
      .select("*")
      .eq("id", exportId)
      .eq("project_id", projectId)
      .single();

    if (exportError || !exportRecord) {
      return NextResponse.json(
        { error: "Export no encontrado" },
        { status: 404 }
      );
    }

    // Check if export is completed and has a storage path
    if (exportRecord.status !== "completed") {
      return NextResponse.json(
        { error: "El export aun no esta listo" },
        { status: 400 }
      );
    }

    if (!exportRecord.storage_path) {
      return NextResponse.json(
        { error: "Archivo no disponible" },
        { status: 404 }
      );
    }

    // Generate a signed URL for download
    const { data: signedUrl, error: signedError } = await supabase
      .storage
      .from("editorial-exports")
      .createSignedUrl(exportRecord.storage_path, 3600); // 1 hour expiry

    if (signedError || !signedUrl) {
      // If signed URL fails, try to get public URL or return error
      console.error("Failed to create signed URL:", signedError);
      return NextResponse.json(
        { error: "No se pudo generar el enlace de descarga" },
        { status: 500 }
      );
    }

    // Log the download activity
    await supabase.from("editorial_activity_log").insert({
      project_id: projectId,
      activity_type: "export_downloaded",
      actor_id: member.user_id,
      payload: {
        export_id: exportId,
        export_type: exportRecord.export_type,
        version: exportRecord.version,
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl.signedUrl,
      filename: `${exportRecord.export_type}_v${exportRecord.version}.${exportRecord.export_type}`,
    });
  } catch (error) {
    console.error("Failed to get download URL:", error);
    return NextResponse.json(
      { error: "Error al obtener el enlace de descarga" },
      { status: 500 }
    );
  }
}
