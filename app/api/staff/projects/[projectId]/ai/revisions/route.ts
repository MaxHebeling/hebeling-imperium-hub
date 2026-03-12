import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { applyEditorialSuggestions } from "@/lib/editorial/ai/apply-suggestions";

/**
 * POST /api/staff/projects/[projectId]/ai/revisions
 *
 * Aplica las sugerencias de IA pendientes (editorial_ai_suggestions) al
 * manuscrito DOCX más reciente del proyecto:
 *  1. Parsea el DOCX con mammoth y extrae párrafos por índice.
 *  2. Reemplaza original_text por suggested_text en cada párrafo indicado.
 *  3. Genera un nuevo DOCX con la librería docx.
 *  4. Sube el archivo resultante a storage (manuscripts bucket).
 *  5. Registra una nueva versión en editorial_files (manuscript_edited).
 *  6. Marca las sugerencias aplicadas como applied=true.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    console.info("[editorial-revisions] POST start", {
      projectId,
      staffUserId: staff.userId,
      staffRole: staff.role,
    });

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado." },
        { status: 404 }
      );
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });

    if (!decision.allowed) {
      if (staff.role === "superadmin") {
        console.info(
          "[editorial-revisions] OVERRIDE ai:run for superadmin",
          {
            projectId,
            orgId: project.org_id,
            userId: staff.userId,
            effectiveCapabilities: decision.effectiveCapabilities,
          }
        );
      } else {
        console.info("[editorial-revisions] FORBIDDEN ai:run", {
          projectId,
          orgId: project.org_id,
          userId: staff.userId,
          effectiveCapabilities: decision.effectiveCapabilities,
          reason: decision.reason,
        });
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: missing ai:run capability" },
          { status: 403 }
        );
      }
    }

    const result = await applyEditorialSuggestions({
      projectId,
      orgId: project.org_id,
      requestedBy: staff.userId,
    });

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      storagePath: result.storagePath,
      version: result.version,
      appliedCount: result.appliedCount,
    });
  } catch (error) {
    console.error("[editorial-revisions] POST error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message.startsWith("No se encontró ningún manuscrito")
            ? 404
            : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
