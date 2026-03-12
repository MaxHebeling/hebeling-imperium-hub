import { NextRequest, NextResponse } from "next/server";
import { createEditorialProject, logEditorialActivity } from "@/lib/editorial/db/mutations";

/**
 * POST /api/editorial/projects
 * Creates a new editorial project (and editorial_stages for pipeline compatibility).
 * editorial_files and editorial_ai_jobs are populated when a manuscript is uploaded.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    console.log("[v0] Creating project with:", {
      title: body.title,
      language: body.language,
    });

    const project = await createEditorialProject({
      title: body.title.trim(),
      subtitle: body.subtitle ?? undefined,
      author_name: body.author_name?.trim() || undefined,
      language: body.language ?? "es",
      genre: body.genre?.trim() || undefined,
      target_audience: body.target_audience?.trim() || body.description?.trim() || undefined,
      client_id: body.client_id ?? undefined,
    });

    console.log("[v0] Project created successfully:", project.id);

    await logEditorialActivity(project.id, "project_created", {
      payload: { title: project.title, stage: project.current_stage },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      project,
    });
  } catch (error) {
    console.error("[v0] [editorial/projects] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
