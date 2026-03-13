import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

export async function GET(_request: NextRequest) {
  try {
    const supabase = getAdminClient();

    const { data: projects, error } = await supabase
      .from("ikingdom_web_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ikingdom/projects] error:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener proyectos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, projects: projects ?? [] });
  } catch (error) {
    console.error("[ikingdom/projects] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
