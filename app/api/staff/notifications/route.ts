import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
  notifyStaffComment,
  notifySuggestion,
  notifyStageStarted,
  notifyStageCompleted,
  notifyProjectUpdate,
  notifyFileShared,
  notifyWelcome,
  notifyProjectCompleted,
} from "@/lib/editorial/notifications/service";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

/**
 * GET /api/staff/notifications
 * Fetch notifications for the authenticated staff member.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.id, { unreadOnly, limit }),
      getUnreadCount(user.id),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[staff/notifications] GET error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/notifications
 * Staff actions: send notification to client, mark all read, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action as string;

    // --- Mark all as read (for staff's own notifications) ---
    if (action === "markAllRead") {
      const ok = await markAllAsRead(user.id);
      return NextResponse.json({ success: ok });
    }

    // --- Send notification to client ---
    if (action === "notify") {
      const {
        projectId,
        type,
        message: msgBody,
        stageKey,
      } = body as {
        projectId: string;
        type: string;
        message?: string;
        stageKey?: EditorialStageKey;
      };

      if (!projectId) {
        return NextResponse.json(
          { success: false, error: "projectId requerido" },
          { status: 400 }
        );
      }

      // Fetch project + client info
      const admin = getAdminClient();
      const { data: project } = await admin
        .from("editorial_projects")
        .select("id, title, client_id")
        .eq("id", projectId)
        .single();

      if (!project || !project.client_id) {
        return NextResponse.json(
          { success: false, error: "Proyecto o cliente no encontrado" },
          { status: 404 }
        );
      }

      // Get staff name for comment/suggestion notifications
      const { data: staffProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const staffName = staffProfile?.full_name || "Equipo Editorial";

      switch (type) {
        case "welcome":
          await notifyWelcome(projectId, project.client_id, project.title);
          break;
        case "comment":
          await notifyStaffComment(
            projectId,
            project.client_id,
            msgBody || "Nuevo comentario del equipo editorial.",
            staffName,
            stageKey
          );
          break;
        case "suggestion":
          await notifySuggestion(
            projectId,
            project.client_id,
            msgBody || "Nueva sugerencia editorial.",
            staffName,
            stageKey
          );
          break;
        case "stage_started":
          if (stageKey) {
            await notifyStageStarted(
              projectId,
              project.client_id,
              stageKey,
              project.title
            );
          }
          break;
        case "stage_completed":
          if (stageKey) {
            await notifyStageCompleted(
              projectId,
              project.client_id,
              stageKey,
              project.title
            );
          }
          break;
        case "project_update":
          await notifyProjectUpdate(
            projectId,
            project.client_id,
            msgBody || "Se actualizaron datos de tu libro.",
            project.title
          );
          break;
        case "file_shared":
          await notifyFileShared(
            projectId,
            project.client_id,
            msgBody || "Archivo",
            project.title
          );
          break;
        case "project_completed":
          await notifyProjectCompleted(
            projectId,
            project.client_id,
            project.title
          );
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Tipo de notificación no válido: ${type}` },
            { status: 400 }
          );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[staff/notifications] POST error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
