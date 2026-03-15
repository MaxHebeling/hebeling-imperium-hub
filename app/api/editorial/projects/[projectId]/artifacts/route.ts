import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { listArtifacts } from "@/lib/editorial/artifacts/storage";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

/**
 * GET /api/editorial/projects/[projectId]/artifacts
 * List all artifacts for a project, optionally filtered by stage.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const { projectId } = await params;
  const stageKey = req.nextUrl.searchParams.get("stage") as EditorialStageKey | null;

  try {
    const artifacts = await listArtifacts(projectId, stageKey ?? undefined);
    return NextResponse.json({ success: true, artifacts });
  } catch (err) {
    console.error("[artifacts] List error:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener artefactos" },
      { status: 500 }
    );
  }
}
