import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { notifyProjectUpdate } from "@/lib/editorial/notifications/service";

/**
 * POST /api/editorial/client/projects/[projectId]/cover-request
 *
 * Client submits their vision for a book cover (author mode).
 *
 * Body JSON:
 * - authorPrompt: string (required) — the author's vision for the cover
 * - colorPalette: string (optional)
 * - references: string (optional) — visual references
 * - imageStyle: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify client owns this project
    const admin = getAdminClient();
    const { data: project, error: projErr } = await admin
      .from("editorial_projects")
      .select("id, client_id, title")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ success: false, error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (project.client_id !== user.id) {
      return NextResponse.json({ success: false, error: "No tienes acceso a este proyecto" }, { status: 403 });
    }

    const body = await request.json();
    const authorPrompt = String(body?.authorPrompt ?? "").trim();

    if (!authorPrompt) {
      return NextResponse.json(
        { success: false, error: "Se requiere una descripción de tu visión para la portada" },
        { status: 400 }
      );
    }

    // Store the cover request in editorial_activity_log
    await admin.from("editorial_activity_log").insert({
      project_id: projectId,
      event_type: "cover_request_by_author",
      actor_id: user.id,
      actor_type: "client",
      payload: {
        authorPrompt,
        colorPalette: body?.colorPalette || null,
        references: body?.references || null,
        imageStyle: body?.imageStyle || null,
      },
    });

    // Notify staff about the author's cover request
    // Find assigned staff or org admin
    const { data: assignments } = await admin
      .from("editorial_staff_assignments")
      .select("user_id")
      .eq("project_id", projectId)
      .limit(5);

    if (assignments && assignments.length > 0) {
      for (const a of assignments) {
        await notifyProjectUpdate(
          projectId,
          a.user_id,
          `El autor ha enviado una solicitud de diseño de portada para "${project.title || "su libro"}"`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tu solicitud de portada ha sido enviada. El equipo editorial la revisará pronto.",
    });
  } catch (error) {
    console.error("[client/cover-request] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
