import { NextRequest, NextResponse } from "next/server";
import {
  getEditorialProject,
  getProjectStages,
  getProjectFiles,
  getProjectComments,
  getProjectExports,
  getProjectJobs,
} from "@/lib/editorial/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const [project, stages, files, comments, exports, jobs] = await Promise.all([
      getEditorialProject(projectId),
      getProjectStages(projectId),
      getProjectFiles(projectId),
      getProjectComments(projectId),
      getProjectExports(projectId),
      getProjectJobs(projectId),
    ]);

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        author_name: project.author_name,
        current_stage: project.current_stage,
        status: project.status,
        progress_percent: project.progress_percent,
        client_id: project.client_id ?? null,
      },
      stages,
      files,
      comments,
      exports,
      jobs,
    });
  } catch (error) {
    console.error("[editorial/progress] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
