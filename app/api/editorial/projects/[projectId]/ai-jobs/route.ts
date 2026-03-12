import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * GET /api/editorial/projects/[projectId]/ai-jobs
 * Get all AI jobs for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  const { searchParams } = new URL(req.url);
  const stageKey = searchParams.get("stageKey");
  const status = searchParams.get("status");

  let query = supabase
    .from("editorial_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (stageKey) {
    query = query.eq("stage_key", stageKey);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data: jobs, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: "Error obteniendo jobs" },
      { status: 500 }
    );
  }

  // Parse output_ref for completed jobs
  const parsedJobs = jobs?.map(job => ({
    id: job.id,
    projectId: job.project_id,
    stageKey: job.stage_key,
    jobType: job.job_type,
    status: job.status,
    createdAt: job.created_at,
    startedAt: job.started_at,
    finishedAt: job.finished_at,
    errorLog: job.error_log,
    result: job.status === "completed" && job.output_ref
      ? (typeof job.output_ref === "string" ? JSON.parse(job.output_ref) : job.output_ref)
      : null,
  })) ?? [];

  return NextResponse.json({
    success: true,
    jobs: parsedJobs,
  });
}
