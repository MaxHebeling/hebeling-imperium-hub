import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

function isMissingIkingdomSchema(error: { code?: string | null; message?: string | null }) {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  );
}

export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data: projects, error } = await supabase
      .from("ikingdom_web_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingIkingdomSchema(error)) {
        return NextResponse.json({
          success: true,
          degraded: true,
          projects: [],
        });
      }

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
