import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { processAiJob } from "@/lib/editorial/ai/processor";
import type { EditorialAiJobContext, EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialAnyStageKey } from "@/lib/editorial/types/editorial";
import { resolvePipelineStageKey } from "@/lib/editorial/pipeline/stage-compat";

/**
 * GET /api/editorial/ai/jobs/[jobId]
 * Get job status and result
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = getAdminClient();

  const { data: job, error } = await supabase
    .from("editorial_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json(
      { success: false, error: "Job no encontrado" },
      { status: 404 }
    );
  }

  // If completed, get the parsed result
  let result = null;
  if (job.status === "completed" && job.output_ref) {
    result = typeof job.output_ref === "string"
      ? JSON.parse(job.output_ref)
      : job.output_ref;
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      projectId: job.project_id,
      stageKey: job.stage_key,
      jobType: job.job_type,
      status: job.status,
      createdAt: job.created_at,
      startedAt: job.started_at,
      finishedAt: job.finished_at,
      errorLog: job.error_log,
    },
    result,
  });
}

/**
 * POST /api/editorial/ai/jobs/[jobId]
 * Retry/reprocess a specific job
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = getAdminClient();

  // Get job details
  const { data: job, error } = await supabase
    .from("editorial_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json(
      { success: false, error: "Job no encontrado" },
      { status: 404 }
    );
  }

  // Reset status to queued if failed
  if (job.status === "failed") {
    await supabase
      .from("editorial_jobs")
      .update({ status: "queued", error_log: null, started_at: null, finished_at: null })
      .eq("id", jobId);
  }

  try {
    const context: EditorialAiJobContext = typeof job.input_ref === "string"
      ? JSON.parse(job.input_ref)
      : job.input_ref;
    const stageKey = resolvePipelineStageKey(job.stage_key as EditorialAnyStageKey);

    const result = await processAiJob({
      jobId: job.id,
      projectId: job.project_id,
      stageKey,
      taskKey: job.job_type as EditorialAiTaskKey,
      context,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
