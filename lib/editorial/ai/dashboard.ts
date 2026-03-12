import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import { listEditorialProjects } from "@/lib/editorial/db/queries";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

export interface AiDashboardKpis {
  jobsQueued: number;
  jobsRunning: number;
  jobsSucceeded24h: number;
  jobsFailed24h: number;
  findingsOpen: number;
  findingsCriticalOpen: number;
  findingsPendingReview: number;
}

export interface AiDashboardJobRow {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  job_type: string;
  status: string;
  created_at: string;
  finished_at: string | null;
}

export interface AiDashboardFindingRow {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey | null;
  severity: string;
  status: string;
  title: string;
  created_at: string;
}

export interface AiDashboardBacklogByStage {
  stage_key: EditorialStageKey | null;
  open_count: number;
}

export interface AiDashboardData {
  kpis: AiDashboardKpis;
  recentJobs: AiDashboardJobRow[];
  recentFindings: AiDashboardFindingRow[];
  backlogByStage: AiDashboardBacklogByStage[];
}

export async function getAiDashboard(): Promise<AiDashboardData> {
  const supabase = getAdminClient();

  const projects = await listEditorialProjects(ORG_ID);
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return {
      kpis: {
        jobsQueued: 0,
        jobsRunning: 0,
        jobsSucceeded24h: 0,
        jobsFailed24h: 0,
        findingsOpen: 0,
        findingsCriticalOpen: 0,
        findingsPendingReview: 0,
      },
      recentJobs: [],
      recentFindings: [],
      backlogByStage: [],
    };
  }

  const now = new Date();
  const dayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: jobsRaw }, { data: findingsRaw }] = await Promise.all([
    supabase
      .from("editorial_jobs")
      .select("id, project_id, stage_key, job_type, status, created_at, finished_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("editorial_ai_findings")
      .select("id, project_id, stage_key, severity, status, title, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const jobs = (jobsRaw ?? []) as AiDashboardJobRow[];
  const findings = (findingsRaw ?? []) as AiDashboardFindingRow[];

  let jobsQueued = 0;
  let jobsRunning = 0;
  let jobsSucceeded24h = 0;
  let jobsFailed24h = 0;

  for (const job of jobs) {
    const s = job.status;
    if (s === "queued") jobsQueued += 1;
    if (s === "processing") jobsRunning += 1;
    if (s === "completed" && job.finished_at && job.finished_at >= dayAgoIso) {
      jobsSucceeded24h += 1;
    }
    if (s === "failed" && job.finished_at && job.finished_at >= dayAgoIso) {
      jobsFailed24h += 1;
    }
  }

  let findingsOpen = 0;
  let findingsCriticalOpen = 0;
  let findingsPendingReview = 0;

  const backlogByStageMap = new Map<string | null, number>();

  for (const f of findings) {
    const status = f.status;
    const severity = f.severity;
    const stageKey = (f.stage_key as EditorialStageKey | null) ?? null;

    if (status === "open") {
      findingsOpen += 1;
      findingsPendingReview += 1;
      const current = backlogByStageMap.get(stageKey) ?? 0;
      backlogByStageMap.set(stageKey, current + 1);
    }
    if (severity === "critical" && status !== "resolved" && status !== "dismissed") {
      findingsCriticalOpen += 1;
    }
  }

  const backlogByStage: AiDashboardBacklogByStage[] = Array.from(backlogByStageMap.entries()).map(
    ([stage_key, open_count]) => ({
      stage_key,
      open_count,
    })
  );

  return {
    kpis: {
      jobsQueued,
      jobsRunning,
      jobsSucceeded24h,
      jobsFailed24h,
      findingsOpen,
      findingsCriticalOpen,
      findingsPendingReview,
    },
    recentJobs: jobs,
    recentFindings: findings,
    backlogByStage,
  };
}

