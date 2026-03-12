import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { STAGE_AI_TASKS, requestStageAiAssist } from "@/lib/editorial/ai/stage-assist";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

const INGEST_STAGE_KEY: EditorialStageKey = "ingesta";

const INGEST_REVIEW_TASKS: EditorialAiTaskKey[] = [
  "issue_detection",
  "manuscript_analysis",
  "quality_scoring",
];

function parseOutputRefSafe(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, any>;
    } catch (error) {
      console.error("[editorial-ai][jobs] output_ref JSON parse error", {
        message: (error as Error).message,
        preview: value.slice(0, 200),
      });
      return null;
    }
  }
  return null;
}

/**
 * GET /api/editorial/projects/[projectId]/ai-jobs
 * Get AI jobs for a project (optionally scoped to a stage).
 *
 * For the ingesta stage we additionally:
 * - Filter to the main review tasks (issue_detection, manuscript_analysis, quality_scoring)
 * - Group by task_key (job_type) and return only the latest job per task in latestByTask
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
    .select(
      "id, project_id, stage_key, job_type, status, input_ref, output_ref, error_log, started_at, finished_at, created_at"
    )
    .eq("project_id", projectId);

  if (stageKey) {
    query = query.eq("stage_key", stageKey);
  }

  if (status) {
    query = query.eq("status", status);
  }

  // For ingesta stage, limit to the core review tasks.
  const effectiveStageKey = (stageKey as EditorialStageKey | null) ?? null;
  if (!effectiveStageKey || effectiveStageKey === INGEST_STAGE_KEY) {
    query = query
      .eq("stage_key", INGEST_STAGE_KEY)
      .in("job_type", INGEST_REVIEW_TASKS as string[]);
  }

  // Order by finished_at DESC (nulls last), then created_at DESC
  query = query
    .order("finished_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data: rows, error } = await query;

  if (error) {
    console.error("[editorial-ai][jobs] error loading editorial_jobs", {
      projectId,
      stageKey,
      status,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return NextResponse.json(
      { success: false, error: "Error obteniendo jobs" },
      { status: 500 }
    );
  }

  const parsedJobs =
    rows?.map((job) => ({
      id: job.id as string,
      projectId: job.project_id as string,
      stageKey: job.stage_key as string | null,
      jobType: job.job_type as string,
      status: job.status as string,
      createdAt: job.created_at as string,
      startedAt: job.started_at as string | null,
      finishedAt: job.finished_at as string | null,
      errorLog: job.error_log as string | null,
      result: parseOutputRefSafe(job.output_ref),
    })) ?? [];

  // Build latestByTask: keep the first occurrence per jobType (list is already ordered)
  const latestByTask: Record<string, (typeof parsedJobs)[number]> = {};
  for (const job of parsedJobs) {
    if (!latestByTask[job.jobType]) {
      latestByTask[job.jobType] = job;
    }
  }

  return NextResponse.json({
    success: true,
    latestByTask,
    recentJobs: parsedJobs,
    jobs: Object.values(latestByTask),
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
