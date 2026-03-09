import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listClientEditorialProjects } from "@/lib/editorial/db/queries";

/**
 * GET /api/editorial/client/projects/list
 * Returns editorial projects that belong to the currently authenticated client.
 * client_id in editorial_projects = profiles.id of the user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const projects = await listClientEditorialProjects(user.id);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("[editorial/client/list] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
