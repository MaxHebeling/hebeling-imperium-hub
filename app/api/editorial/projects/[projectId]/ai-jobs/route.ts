import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { STAGE_AI_TASKS, requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

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

/**
 * POST /api/editorial/projects/[projectId]/ai-jobs
 * Request a new AI analysis job for a stage
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = getAdminClient();

  try {
    const body = await req.json();
    const { stageKey, taskKey } = body as { 
      stageKey: EditorialStageKey; 
      taskKey?: EditorialAiTaskKey;
    };

    if (!stageKey) {
      return NextResponse.json(
        { success: false, error: "Se requiere stageKey" },
        { status: 400 }
      );
    }

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select("id, org_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Get the latest file for this project
    const { data: latestFile } = await supabase
      .from("editorial_files")
      .select("id, version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    // Determine which tasks to run
    const tasksToRun: EditorialAiTaskKey[] = taskKey 
      ? [taskKey] 
      : (STAGE_AI_TASKS[stageKey] ?? []);

    if (tasksToRun.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay tareas de IA disponibles para esta etapa" },
        { status: 400 }
      );
    }

    // Create jobs for each task
    const createdJobs: string[] = [];
    for (const task of tasksToRun) {
      try {
        const result = await requestStageAiAssist({
          orgId: project.org_id,
          projectId,
          stageKey,
          taskKey: task,
          requestedBy: "staff", // TODO: Get actual user ID
          sourceFileId: latestFile?.id,
          sourceFileVersion: latestFile?.version_number,
        });
        createdJobs.push(result.jobId);
      } catch (err) {
        console.error(`Failed to create job for ${task}:`, err);
      }
    }

    if (createdJobs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se pudieron crear los trabajos de IA" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Se crearon ${createdJobs.length} trabajos de IA`,
      jobIds: createdJobs,
    });
  } catch (err) {
    console.error("Error creating AI jobs:", err);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
