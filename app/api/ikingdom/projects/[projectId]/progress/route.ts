import { NextRequest, NextResponse } from "next/server";
import { requireIKingdomSessionAccess } from "@/lib/ikingdom/route-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const access = await requireIKingdomSessionAccess();
    if (!access.ok) {
      return access.response;
    }

    const { projectId } = await params;

    const [projectRes, stagesRes, filesRes, deliverablesRes] = await Promise.all([
      access.supabase
        .from("ikingdom_web_projects")
        .select("*")
        .eq("id", projectId)
        .single(),
      access.supabase
        .from("ikingdom_web_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      access.supabase
        .from("ikingdom_web_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      access.supabase
        .from("ikingdom_web_deliverables")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    if (projectRes.error || !projectRes.data) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        id: projectRes.data.id,
        title: projectRes.data.title,
        description: projectRes.data.description,
        client_name: projectRes.data.client_name,
        domain: projectRes.data.domain,
        service_type: projectRes.data.service_type,
        current_stage: projectRes.data.current_stage,
        status: projectRes.data.status,
        progress_percent: projectRes.data.progress_percent,
        tech_stack: projectRes.data.tech_stack,
        client_id: projectRes.data.client_id ?? null,
        due_date: projectRes.data.due_date,
        created_at: projectRes.data.created_at,
      },
      stages: stagesRes.data ?? [],
      files: filesRes.data ?? [],
      deliverables: deliverablesRes.data ?? [],
    });
  } catch (error) {
    console.error("[ikingdom/progress] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
