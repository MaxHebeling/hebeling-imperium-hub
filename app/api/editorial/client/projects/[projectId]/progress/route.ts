import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getClientEditorialProject,
  getProjectStages,
  getClientProjectFiles,
  getClientProjectComments,
  getClientProjectExports,
} from "@/lib/editorial/db/queries";

/**
 * GET /api/editorial/client/projects/[projectId]/progress
 * Returns the pipeline progress for a project owned by the authenticated client.
 * Internal files, jobs, and activity logs are intentionally omitted.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify ownership – returns null if the project doesn't belong to this client
    const project = await getClientEditorialProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const [stages, files, comments, exports] = await Promise.all([
      getProjectStages(projectId),
      getClientProjectFiles(projectId),
      getClientProjectComments(projectId),
      getClientProjectExports(projectId),
    ]);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        subtitle: project.subtitle,
        author_name: project.author_name,
        language: project.language,
        genre: project.genre,
        current_stage: project.current_stage,
        status: project.status,
        progress_percent: project.progress_percent,
        due_date: project.due_date,
      },
      stages,
      files,
      comments,
      exports,
    });
  } catch (error) {
    console.error("[editorial/client/progress] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
