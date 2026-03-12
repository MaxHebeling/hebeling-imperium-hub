import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialManuscriptAnalysis } from "@/lib/editorial/ai/openai";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";

export type EditorialJobRow = {
  id: string;
  project_id: string;
  stage_key: string | null;
  job_type: string;
  provider: string | null;
  status: string;
  input_ref: unknown | null;
  output_ref: unknown | null;
  error_log: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export interface ManuscriptJobSummary {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  fileId?: string | null;
  fileVersion?: number | null;
  readiness_score?: number | null;
}

export interface ProjectManuscriptAnalysisState {
  latestJob: ManuscriptJobSummary | null;
  latestAnalysis: EditorialManuscriptAnalysis | null;
  recentJobs: ManuscriptJobSummary[];
  latestManuscriptVersion: number | null;
  latestManuscriptFileId: string | null;
  analyzedFileVersion: number | null;
  analyzedFileId: string | null;
  isOutdated: boolean;
}

function parseJsonSafe<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "object") {
    return value as T;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("[editorial-ai][read] JSON parse error", {
        message: (error as Error).message,
        valuePreview: value.slice(0, 200),
      });
      return null;
    }
  }
  return null;
}

export async function getProjectManuscriptAnalysis(
  projectId: string
): Promise<ProjectManuscriptAnalysisState> {
  const supabase = getAdminClient();

  console.info("[editorial-ai][read] loading manuscript analysis state", {
    projectId,
  });

  const { data, error } = await supabase
    .from("editorial_jobs")
    .select(
      "id, project_id, stage_key, job_type, provider, status, input_ref, output_ref, error_log, started_at, finished_at, created_at"
    )
    .eq("project_id", projectId)
    .eq("job_type", "manuscript_analysis")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[editorial-ai][read] editorial_jobs query error", {
      projectId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      latestJob: null,
      latestAnalysis: null,
      recentJobs: [],
      latestManuscriptVersion: null,
      latestManuscriptFileId: null,
      analyzedFileVersion: null,
      analyzedFileId: null,
      isOutdated: false,
    };
  }

  const rows = (data ?? []) as EditorialJobRow[];

  if (rows.length === 0) {
    console.info("[editorial-ai][read] no manuscript_analysis jobs found", { projectId });
    return {
      latestJob: null,
      latestAnalysis: null,
      recentJobs: [],
      latestManuscriptVersion: null,
      latestManuscriptFileId: null,
      analyzedFileVersion: null,
      analyzedFileId: null,
      isOutdated: false,
    };
  }

  const summaries: ManuscriptJobSummary[] = rows.map((row) => {
    const input = parseJsonSafe<{
      source_file_id?: string | null;
      source_file_version?: number | null;
    }>(row.input_ref);

    const analysis = parseJsonSafe<EditorialManuscriptAnalysis>(row.output_ref);

    return {
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      error: row.error_log,
      fileId: input?.source_file_id ?? null,
      fileVersion: input?.source_file_version ?? null,
      readiness_score: analysis?.readiness_score ?? null,
    };
  });

  const latestRow = rows[0];
  const latestSummary = summaries[0] ?? null;
  const latestAnalysis = parseJsonSafe<EditorialManuscriptAnalysis>(latestRow.output_ref);

  // Obtener la versión actual del manuscrito más reciente.
  const latestManuscript = await getLatestManuscriptForProject(projectId);
  const latestManuscriptVersion = latestManuscript?.file.version ?? null;
  const latestManuscriptFileId = latestManuscript?.file.id ?? null;

  const analyzedFileVersion = latestSummary?.fileVersion ?? null;
  const analyzedFileId = latestSummary?.fileId ?? null;

  const isOutdated =
    latestManuscriptVersion != null &&
    (analyzedFileVersion == null || latestManuscriptVersion > analyzedFileVersion);

  console.info("[editorial-ai][read] manuscript analysis state loaded", {
    projectId,
    jobs: rows.length,
    latestStatus: latestSummary?.status,
    latestManuscriptVersion,
    analyzedFileVersion,
    isOutdated,
  });

  return {
    latestJob: latestSummary,
    latestAnalysis,
    recentJobs: summaries,
    latestManuscriptVersion,
    latestManuscriptFileId,
    analyzedFileVersion,
    analyzedFileId,
    isOutdated,
  };
}

