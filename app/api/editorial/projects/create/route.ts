import { NextRequest, NextResponse } from "next/server";
import { createEditorialProject, logEditorialActivity } from "@/lib/editorial/db/mutations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    const serviceType = body.service_type ?? "full_pipeline";

    const project = await createEditorialProject({
      title: body.title.trim(),
      subtitle: body.subtitle ?? undefined,
      author_name: body.author_name ?? undefined,
      language: body.language ?? "es",
      genre: body.genre ?? undefined,
      target_audience: body.target_audience ?? undefined,
      client_id: body.client_id ?? undefined,
      service_type: serviceType,
    });

    await logEditorialActivity(project.id, "project_created", {
      payload: { title: project.title, stage: project.current_stage, service_type: serviceType },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[editorial/create] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
