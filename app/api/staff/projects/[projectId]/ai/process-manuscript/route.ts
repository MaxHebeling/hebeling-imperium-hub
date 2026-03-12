import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { processManuscriptNow } from "@/lib/editorial/ai/process-manuscript";
import { getProjectManuscriptAnalysis } from "@/lib/editorial/ai/get-project-manuscript-analysis";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * POST /api/staff/projects/[projectId]/ai/process-manuscript
 *
 * Ejecuta un análisis editorial inicial del manuscrito más reciente del proyecto.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    console.info("[editorial-ai][process] endpoint start", {
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

    // Debug membership / capabilities before enforcing ai:run
    const admin = getAdminClient();
    const { data: membership, error: membershipError } = await admin
      .from("editorial_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", staff.userId);
    console.info("[editorial-ai][process] membership debug", {
      projectId,
      orgId: project.org_id,
      staffUserId: staff.userId,
      staffRole: staff.role,
      membership,
      membershipError,
    });

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });

    if (!decision.allowed) {
      // Allow hard override for org-level superadmin while we debug capabilities.
      if (staff.role === "superadmin") {
        console.info("[editorial-ai][process] OVERRIDE ai:run for superadmin", {
          projectId,
          orgId: project.org_id,
          userId: staff.userId,
          staffRole: staff.role,
          requestedCapability: "ai:run",
          effectiveCapabilities: decision.effectiveCapabilities,
          reason: decision.reason,
        });
      } else {
        console.info("[editorial-ai][process] FORBIDDEN ai:run", {
          projectId,
          orgId: project.org_id,
          userId: staff.userId,
          staffRole: staff.role,
          requestedCapability: "ai:run",
          effectiveCapabilities: decision.effectiveCapabilities,
          reason: decision.reason,
        });
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: missing ai:run capability" },
          { status: 403 }
        );
      }
    }

    const result = await processManuscriptNow({
      projectId,
      orgId: project.org_id,
      requestedBy: staff.userId,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      fileId: result.file.id,
      fileVersion: result.file.version,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("[editorial-ai][process] endpoint error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
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

/**
 * GET /api/staff/projects/[projectId]/ai/process-manuscript
 *
 * Devuelve el último job de análisis de manuscrito y un historial reciente.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    console.info("[editorial-ai][read] GET state start", {
      projectId,
      staffUserId: staff.userId,
      staffRoles: staff.roles,
    });

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado." },
        { status: 404 }
      );
    }

    // Para leer resultados de AI usamos ai:review (lectura de análisis).
    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:review",
    });

    if (!decision.allowed) {
      console.info("[editorial-ai][read] FORBIDDEN ai:review", {
        projectId,
        orgId: project.org_id,
        userId: staff.userId,
        effectiveCapabilities: decision.effectiveCapabilities,
        reason: decision.reason,
      });
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: missing ai:review capability" },
        { status: 403 }
      );
    }

    const state = await getProjectManuscriptAnalysis(projectId);

    return NextResponse.json({
      success: true,
      latestJob: state.latestJob,
      latestAnalysis: state.latestAnalysis,
      recentJobs: state.recentJobs,
      latestManuscriptVersion: state.latestManuscriptVersion,
      latestManuscriptFileId: state.latestManuscriptFileId,
      analyzedFileVersion: state.analyzedFileVersion,
      analyzedFileId: state.analyzedFileId,
      isOutdated: state.isOutdated,
    });
  } catch (error) {
    console.error("[editorial-ai][read] GET state error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}


