import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getClientTimeline,
  advanceTimeline,
  applyTimelineOverride,
  initializeTimeline,
} from "@/lib/editorial/timeline";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";
import type { TimelineOverrideType } from "@/lib/editorial/timeline";

/**
 * GET /api/editorial/timeline/[projectId]
 * Returns the client-visible timeline for a project.
 * Auto-advances the timeline before returning.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    // Initialize timeline if it doesn't exist yet
    await initializeTimeline(projectId);

    // Auto-advance the timeline
    await advanceTimeline(projectId);

    // Get timeline state
    const timeline = await getClientTimeline(projectId);
    if (!timeline) {
      return NextResponse.json({ success: false, error: "Proyecto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, timeline });
  } catch (err) {
    console.error("[timeline] GET error:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/editorial/timeline/[projectId]
 * Staff action: apply an override to the timeline.
 * Body: { overrideType, stageKey?, payload?, reason? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    // Check staff role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["superadmin", "admin", "sales", "ops"];
    if (!profile || !staffRoles.includes(profile.role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { overrideType, stageKey, payload, reason } = body as {
      overrideType: TimelineOverrideType;
      stageKey?: EditorialPipelineStageKey;
      payload?: Record<string, unknown>;
      reason?: string;
    };

    if (!overrideType) {
      return NextResponse.json({ success: false, error: "overrideType requerido" }, { status: 400 });
    }

    const ok = await applyTimelineOverride(
      projectId,
      overrideType,
      user.id,
      stageKey ?? null,
      payload ?? null,
      reason ?? null
    );

    if (!ok) {
      return NextResponse.json({ success: false, error: "Error aplicando override" }, { status: 500 });
    }

    // Return updated timeline
    const timeline = await getClientTimeline(projectId);
    return NextResponse.json({ success: true, timeline });
  } catch (err) {
    console.error("[timeline] POST error:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
