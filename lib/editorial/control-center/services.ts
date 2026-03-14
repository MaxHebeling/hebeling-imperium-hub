import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import { listEditorialProjects } from "@/lib/editorial/db/queries";
import { calculateProgressPercent } from "@/lib/editorial/pipeline/progress";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ControlCenterKpis {
  activeProjects: number;
  aiProcessing: number;
  awaitingReview: number;
  readyForPublishing: number;
  clientReviewStage: number;
  completedThisMonth: number;
}

export interface PipelineProjectRow {
  id: string;
  title: string;
  authorName: string | null;
  stage: string;
  stageLabel: string;
  aiStatus: "idle" | "queued" | "running" | "completed" | "failed";
  staffReview: "pending" | "in_review" | "approved";
  progressPercent: number;
  language: string;
  createdAt: string;
  status: string;
}

export interface StageBreakdown {
  stageKey: string;
  stageLabel: string;
  projectCount: number;
}

export interface ControlCenterData {
  kpis: ControlCenterKpis;
  pipelineProjects: PipelineProjectRow[];
  stageBreakdown: StageBreakdown[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export async function getControlCenterData(): Promise<ControlCenterData> {
  const supabase = getAdminClient();
  const projects = await listEditorialProjects(ORG_ID);
  const projectIds = projects.map((p) => p.id);

  // Fetch all jobs for all projects to determine AI status per project
  let jobsByProject = new Map<string, { status: string }[]>();
  if (projectIds.length > 0) {
    const { data: jobs } = await supabase
      .from("editorial_jobs")
      .select("project_id, status")
      .in("project_id", projectIds);

    for (const job of jobs ?? []) {
      const list = jobsByProject.get(job.project_id) ?? [];
      list.push({ status: job.status });
      jobsByProject.set(job.project_id, list);
    }
  }

  // Fetch stages for review status
  let stagesByProject = new Map<string, { stage_key: string; status: string }[]>();
  if (projectIds.length > 0) {
    const { data: stages } = await supabase
      .from("editorial_stages")
      .select("project_id, stage_key, status")
      .in("project_id", projectIds);

    for (const stage of stages ?? []) {
      const list = stagesByProject.get(stage.project_id) ?? [];
      list.push({ stage_key: stage.stage_key, status: stage.status });
      stagesByProject.set(stage.project_id, list);
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build pipeline rows
  const pipelineProjects: PipelineProjectRow[] = projects.map((p) => {
    const jobs = jobsByProject.get(p.id) ?? [];
    const stages = stagesByProject.get(p.id) ?? [];

    // AI status: check if any jobs are running/queued for this project
    let aiStatus: PipelineProjectRow["aiStatus"] = "idle";
    if (jobs.some((j) => j.status === "processing")) {
      aiStatus = "running";
    } else if (jobs.some((j) => j.status === "queued")) {
      aiStatus = "queued";
    } else if (jobs.some((j) => j.status === "failed")) {
      aiStatus = "failed";
    } else if (jobs.some((j) => j.status === "completed")) {
      aiStatus = "completed";
    }

    // Staff review: check current stage status
    const currentStageRecord = stages.find((s) => s.stage_key === p.current_stage);
    let staffReview: PipelineProjectRow["staffReview"] = "pending";
    if (currentStageRecord?.status === "review_required") {
      staffReview = "in_review";
    } else if (currentStageRecord?.status === "approved" || currentStageRecord?.status === "completed") {
      staffReview = "approved";
    }

    return {
      id: p.id,
      title: p.title,
      authorName: p.author_name,
      stage: p.current_stage,
      stageLabel: EDITORIAL_STAGE_LABELS[p.current_stage] ?? p.current_stage,
      aiStatus,
      staffReview,
      progressPercent: calculateProgressPercent(p.current_stage),
      language: p.language ?? "es",
      createdAt: p.created_at,
      status: p.status,
    };
  });

  // KPIs
  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "archived").length;
  const aiProcessing = pipelineProjects.filter((p) => p.aiStatus === "running" || p.aiStatus === "queued").length;
  const awaitingReview = pipelineProjects.filter((p) => p.staffReview === "in_review").length;
  const readyForPublishing = projects.filter((p) => p.current_stage === "export" || p.current_stage === "distribution").length;
  const clientReviewStage = projects.filter((p) => p.current_stage === "revision_final").length;
  const completedThisMonth = projects.filter((p) => {
    if (p.status !== "completed") return false;
    const updated = p.updated_at ?? p.created_at;
    return new Date(updated) >= startOfMonth;
  }).length;

  // Stage breakdown
  const stageCounts = new Map<string, number>();
  for (const p of projects) {
    if (p.status === "completed" || p.status === "archived") continue;
    const count = stageCounts.get(p.current_stage) ?? 0;
    stageCounts.set(p.current_stage, count + 1);
  }

  const stageBreakdown: StageBreakdown[] = Array.from(stageCounts.entries())
    .map(([stageKey, projectCount]) => ({
      stageKey,
      stageLabel: EDITORIAL_STAGE_LABELS[stageKey as EditorialStageKey] ?? stageKey,
      projectCount,
    }))
    .sort((a, b) => {
      const order = ["ingesta", "estructura", "estilo", "ortotipografia", "maquetacion", "revision_final", "export", "distribution"];
      return order.indexOf(a.stageKey) - order.indexOf(b.stageKey);
    });

  return {
    kpis: {
      activeProjects,
      aiProcessing,
      awaitingReview,
      readyForPublishing,
      clientReviewStage,
      completedThisMonth,
    },
    pipelineProjects,
    stageBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Project Workspace data
// ---------------------------------------------------------------------------

export interface ProjectWorkspaceData {
  project: {
    id: string;
    title: string;
    subtitle: string | null;
    authorName: string | null;
    language: string;
    genre: string | null;
    targetAudience: string | null;
    wordCount: number | null;
    pageEstimate: number | null;
    currentStage: string;
    status: string;
    progressPercent: number;
    createdAt: string;
  };
  stages: {
    stageKey: string;
    stageLabel: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    aiSummary: string | null;
  }[];
  aiJobs: {
    id: string;
    stageKey: string | null;
    jobType: string;
    status: string;
    createdAt: string;
    finishedAt: string | null;
    outputRef: string | null;
  }[];
  files: {
    id: string;
    stageKey: string | null;
    fileType: string;
    version: number;
    storagePath: string;
    mimeType: string | null;
    sizeBytes: number | null;
    createdAt: string;
  }[];
  manuscriptContent: string | null;
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspaceData | null> {
  const supabase = getAdminClient();

  const { data: project } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  const [{ data: stages }, { data: jobs }, { data: files }] = await Promise.all([
    supabase
      .from("editorial_stages")
      .select("stage_key, status, started_at, completed_at, ai_summary")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("editorial_jobs")
      .select("id, stage_key, job_type, status, created_at, finished_at, output_ref")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("editorial_files")
      .select("id, stage_key, file_type, version, storage_path, mime_type, size_bytes, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    project: {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle ?? null,
      authorName: project.author_name ?? null,
      language: project.language ?? "es",
      genre: project.genre ?? null,
      targetAudience: project.target_audience ?? null,
      wordCount: project.word_count ?? null,
      pageEstimate: project.page_estimate ?? null,
      currentStage: project.current_stage,
      status: project.status,
      progressPercent: calculateProgressPercent(project.current_stage as EditorialStageKey),
      createdAt: project.created_at,
    },
    stages: (stages ?? []).map((s: Record<string, unknown>) => ({
      stageKey: s.stage_key as string,
      stageLabel: EDITORIAL_STAGE_LABELS[(s.stage_key as string) as EditorialStageKey] ?? (s.stage_key as string),
      status: s.status as string,
      startedAt: (s.started_at as string | null) ?? null,
      completedAt: (s.completed_at as string | null) ?? null,
      aiSummary: (s.ai_summary as string | null) ?? null,
    })),
    aiJobs: (jobs ?? []).map((j: Record<string, unknown>) => ({
      id: j.id as string,
      stageKey: (j.stage_key as string | null) ?? null,
      jobType: j.job_type as string,
      status: j.status as string,
      createdAt: j.created_at as string,
      finishedAt: (j.finished_at as string | null) ?? null,
      outputRef: (j.output_ref as string | null) ?? null,
    })),
    files: (files ?? []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      stageKey: (f.stage_key as string | null) ?? null,
      fileType: f.file_type as string,
      version: f.version as number,
      storagePath: f.storage_path as string,
      mimeType: (f.mime_type as string | null) ?? null,
      sizeBytes: (f.size_bytes as number | null) ?? null,
      createdAt: f.created_at as string,
    })),
    manuscriptContent: null,
  };
}
