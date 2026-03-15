import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getArtifactDownloadUrl } from "@/lib/editorial/artifacts/storage";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * GET /api/editorial/projects/[projectId]/artifacts/[artifactId]/download
 * Returns a signed download URL for an artifact.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; artifactId: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const { projectId, artifactId } = await params;
  const supabase = getAdminClient();

  // Verify artifact belongs to project
  const { data: artifact, error } = await supabase
    .from("editorial_pipeline_artifacts")
    .select("storage_path, file_name, mime_type")
    .eq("id", artifactId)
    .eq("project_id", projectId)
    .single();

  if (error || !artifact) {
    return NextResponse.json(
      { success: false, error: "Artefacto no encontrado" },
      { status: 404 }
    );
  }

  try {
    const url = await getArtifactDownloadUrl(artifact.storage_path);
    return NextResponse.json({
      success: true,
      url,
      fileName: artifact.file_name,
      mimeType: artifact.mime_type,
    });
  } catch (err) {
    console.error("[artifacts] Download URL error:", err);
    return NextResponse.json(
      { success: false, error: "Error al generar enlace de descarga" },
      { status: 500 }
    );
  }
}
