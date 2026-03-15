import { NextRequest, NextResponse } from "next/server";
import { createEditorialProject, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/editorial/projects
 * Creates a new editorial project (and editorial_stages for pipeline compatibility).
 * editorial_files and editorial_ai_jobs are populated when a manuscript is uploaded.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    const project = await createEditorialProject({
      title: body.title.trim(),
      subtitle: body.subtitle ?? undefined,
      author_name: body.author_name?.trim() || undefined,
      language: body.language ?? "es",
      genre: body.genre?.trim() || undefined,
      target_audience: body.target_audience?.trim() || body.description?.trim() || undefined,
      client_id: body.client_id ?? undefined,
      created_by: user.id,
      service_type: body.service_type ?? undefined,
    });

    await logEditorialActivity(project.id, "project_created", {
      payload: { title: project.title, stage: project.current_stage },
    });

    return NextResponse.json(
      { projectId: project.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[editorial/projects] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
