import { NextRequest, NextResponse } from "next/server";
import type { WebStageKey } from "@/lib/ikingdom/types/web-project";
import { WEB_STAGE_KEYS } from "@/lib/ikingdom/pipeline/constants";
import { requireIKingdomStaffAccess } from "@/lib/ikingdom/route-auth";

export async function POST(request: NextRequest) {
  try {
    const access = await requireIKingdomStaffAccess();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "El t\u00edtulo es obligatorio" },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error: projectError } = await access.admin
      .from("ikingdom_web_projects")
      .insert({
        org_id: access.orgId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        client_name: body.client_name?.trim() || null,
        domain: body.domain?.trim() || null,
        service_type: body.service_type || null,
        tech_stack: body.tech_stack?.trim() || null,
        current_stage: "briefing" as WebStageKey,
        status: "draft",
        progress_percent: 0,
        client_id: body.client_id || null,
        due_date: body.due_date || null,
        created_by: access.staff.userId,
      })
      .select("*")
      .single();

    if (projectError || !project) {
      console.error("[ikingdom/create] error:", projectError);
      return NextResponse.json(
        { success: false, error: projectError?.message ?? "Error al crear proyecto" },
        { status: 500 }
      );
    }

    // Create stage rows for each pipeline stage
    const stageRows = WEB_STAGE_KEYS.map((key) => ({
      project_id: project.id,
      stage_key: key,
      status: key === "briefing" ? "processing" : "pending",
    }));

    const { error: stagesError } = await access.admin
      .from("ikingdom_web_stages")
      .insert(stageRows);

    if (stagesError) {
      console.error("[ikingdom/create] stages error:", stagesError);
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[ikingdom/create] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
