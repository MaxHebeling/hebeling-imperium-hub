import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
} from "@/lib/editorial/notifications/service";

/**
 * GET /api/editorial/client/notifications
 * Fetch notifications for the authenticated client.
 * Query params: ?unreadOnly=true&limit=50&projectId=xxx
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
    const projectId = url.searchParams.get("projectId") || undefined;

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.id, { unreadOnly, limit, projectId }),
      getUnreadCount(user.id),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[client/notifications] GET error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/editorial/client/notifications
 * Actions: markAllRead
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

    if (action === "markAllRead") {
      const ok = await markAllAsRead(user.id);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[client/notifications] POST error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
