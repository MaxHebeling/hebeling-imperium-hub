import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import type { WebStageKey } from "@/lib/ikingdom/types/web-project";
import { WEB_STAGE_KEYS } from "@/lib/ikingdom/pipeline/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "El t\u00edtulo es obligatorio" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get org_id from first org (same pattern as editorial)
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    const orgId = org?.id ?? "default";

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("ikingdom_web_projects")
      .insert({
        org_id: orgId,
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

    const { error: stagesError } = await supabase
      .from("ikingdom_web_stages")
      .insert(stageRows);

    if (stagesError) {
      console.error("[ikingdom/create] stages error:", stagesError);
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[ikingdom/create] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
