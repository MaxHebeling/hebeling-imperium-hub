import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialAnalysisReport,
  EditorialAnalysisResult,
} from "./types";
import { parseEditorialAnalysisReport } from "./parser";
import { parseEditorialAnalysisInput, assertAnalysisState } from "./validation";
import type { NormalizedManuscriptDocument } from "../preprocessing/types";

const ANALYSIS_MODEL = "gpt-4o-mini";
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

type WorkflowRow = {
  id: string;
  current_state: string;
  metrics: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  title: string;
  language: string | null;
  genre: string | null;
  current_status: string | null;
};

type AnalysisSourceAssetRow = {
  id: string;
  source_uri: string | null;
  original_file_name: string;
  version: number;
  details: Record<string, unknown> | null;
};

function buildAnalysisInputExcerpt(document: NormalizedManuscriptDocument): string {
  const normalized = document.normalized_text;
  if (normalized.length <= 32000) {
    return normalized;
  }

  const head = normalized.slice(0, 12000);
  const middleStart = Math.floor(normalized.length / 2) - 4000;
  const middle = normalized.slice(Math.max(0, middleStart), Math.max(0, middleStart) + 8000);
  const tail = normalized.slice(-12000);

  return `${head}\n\n[... middle excerpt ...]\n\n${middle}\n\n[... final excerpt ...]\n\n${tail}`;
}

function buildAnalysisPrompt(options: {
  title: string;
  declaredLanguage: string;
  declaredGenre: string;
  document: NormalizedManuscriptDocument;
}): string {
  const documentExcerpt = buildAnalysisInputExcerpt(options.document);

  return [
    "You are a senior editorial analyst for a premium publishing house.",
    "Analyze the manuscript and return only valid JSON.",
    "No markdown. No explanation outside JSON.",
    "",
    "Return this exact structure:",
    JSON.stringify(
      {
        detected_genre: "string",
        target_audience: "string",
        score: {
          overall: 0,
          structure: 0,
          clarity: 0,
          language: 0,
          market_fit: 0,
        },
        executive_summary: "string",
        strengths: ["string"],
        weaknesses: ["string"],
        issues: [
          {
            severity: "critical | major | minor",
            category: "structure | clarity | language | market_fit | voice",
            title: "string",
            explanation: "string",
          },
        ],
        recommendations: ["string"],
        reasoning: {
          score_summary: "string",
          genre_reasoning: "string",
          audience_reasoning: "string",
        },
      },
      null,
      2
    ),
    "",
    "Scoring rules:",
    "- 0 to 100 integers only",
    "- be explainable and conservative",
    "- strengths and weaknesses must be specific",
    "- issues must be editorially actionable",
    "",
    `Title: ${options.title}`,
    `Declared language: ${options.declaredLanguage}`,
    `Declared genre: ${options.declaredGenre}`,
    `Detected language: ${options.document.detected_language.code}`,
    `Word count: ${options.document.stats.word_count}`,
    `Chapter count: ${options.document.stats.chapter_count}`,
    `Heading count: ${options.document.stats.heading_count}`,
    "",
    "Detected chapter titles:",
    options.document.chapters.map((chapter) => `- ${chapter.title}`).join("\n") || "- None",
    "",
    "Manuscript excerpt:",
    documentExcerpt,
  ].join("\n");
}

async function getProjectAndWorkflow(projectId: string): Promise<{
  project: ProjectRow;
  workflow: WorkflowRow;
}> {
  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id, title, language, genre, current_status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to load editorial project: ${projectError?.message}`);
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state, metrics, context")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(`Failed to load editorial workflow: ${workflowError?.message}`);
  }

  return {
    project: project as ProjectRow,
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentNormalizedAsset(
  projectId: string
): Promise<AnalysisSourceAssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, original_file_name, version, details")
    .eq("project_id", projectId)
    .eq("asset_kind", "normalized_text")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to load normalized manuscript asset: ${error?.message}`);
  }

  if (!data.source_uri) {
    throw new Error("The normalized manuscript asset does not have a source URI.");
  }

  return data as AnalysisSourceAssetRow;
}

async function readNormalizedDocument(
  storagePath: string
): Promise<NormalizedManuscriptDocument> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download normalized manuscript: ${error?.message}`);
  }

  const raw = Buffer.from(await data.arrayBuffer()).toString("utf8");
  return JSON.parse(raw) as NormalizedManuscriptDocument;
}

async function getNextAnalysisVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "analysis_output")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read analysis asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function generateEditorialAnalysisReport(options: {
  project: ProjectRow;
  normalizedAssetId: string;
  sourceAssetId: string;
  document: NormalizedManuscriptDocument;
}): Promise<EditorialAnalysisReport> {
  const generatedAt = createFoundationTimestamp();
  const prompt = buildAnalysisPrompt({
    title: options.project.title,
    declaredLanguage: options.project.language ?? options.document.declared_language,
    declaredGenre: options.project.genre ?? "general",
    document: options.document,
  });

  const result = await generateText({
    model: openai(ANALYSIS_MODEL),
    temperature: 0,
    prompt,
  });

  return parseEditorialAnalysisReport({
    rawText: result.text,
    projectId: options.project.id,
    sourceAssetId: options.sourceAssetId,
    normalizedAssetId: options.normalizedAssetId,
    generatedAt,
    model: ANALYSIS_MODEL,
    fallbackGenre: options.project.genre ?? "general",
    fallbackAudience: "Lectores generales del genero declarado",
  });
}

async function uploadAnalysisReport(
  projectId: string,
  version: number,
  report: EditorialAnalysisReport
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/analysis/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(report, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload editorial analysis report: ${error.message}`);
  }

  return storagePath;
}

async function persistAnalysisState(input: {
  projectId: string;
  workflowId: string;
  currentState: "normalized" | "analyzed";
  normalizedAssetId: string;
  normalizedAssetVersion: number;
  analysisStoragePath: string;
  report: EditorialAnalysisReport;
  analysisVersion: number;
}): Promise<{
  analysisAssetId: string;
  transitioned: boolean;
}> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const analysisAssetId = createFoundationId();
  const transitioned = input.currentState === "normalized";

  if (transitioned) {
    validateEditorialWorkflowTransition("normalized", "analyzed");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "analysis_output")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current analysis asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: analysisAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "analysis_output",
    source_type: "external",
    source_label: `Editorial analysis v${input.analysisVersion}`,
    source_uri: input.analysisStoragePath,
    original_file_name: `analysis-v${input.analysisVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.report), "utf8"),
    extracted_text_uri: null,
    version: input.analysisVersion,
    is_current: true,
    details: {
      model: input.report.model,
      score: input.report.score,
      detected_genre: input.report.detected_genre,
      target_audience: input.report.target_audience,
      source_normalized_asset_id: input.normalizedAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist analysis asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "analyzed",
      context: {
        analysis_asset_id: analysisAssetId,
        normalized_asset_id: input.normalizedAssetId,
      },
      metrics: {
        overall_score: input.report.score.overall,
        structure_score: input.report.score.structure,
        clarity_score: input.report.score.clarity,
        language_score: input.report.score.language,
        market_fit_score: input.report.score.market_fit,
      },
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to update editorial workflow: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("analyzed"),
      current_status: "analyzed",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          analysis_completed: true,
          analysis_asset_id: analysisAssetId,
          normalized_asset_id: input.normalizedAssetId,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project analysis state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "analyzed",
      event_type: "analysis.report_generated",
      level: "info",
      message: "Editorial analysis report generated successfully.",
      payload: {
        analysisAssetId,
        model: input.report.model,
        overallScore: input.report.score.overall,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "analyzed",
      event_type: "analysis.genre_detected",
      level: "info",
      message: "Genre and audience analysis completed.",
      payload: {
        detectedGenre: input.report.detected_genre,
        targetAudience: input.report.target_audience,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "analyzed",
      event_type: transitioned ? "workflow.transitioned" : "workflow.reanalyzed",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from normalized to analyzed."
        : "Editorial analysis was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "analyzed",
        analysisAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist analysis logs: ${logsError.message}`);
  }

  return {
    analysisAssetId,
    transitioned,
  };
}

export async function executeEditorialAnalysis(
  input: unknown
): Promise<EditorialAnalysisResult> {
  const parsed = parseEditorialAnalysisInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertAnalysisState(
    workflow.current_state ?? project.current_status
  ) as "normalized" | "analyzed";

  const normalizedAsset = await getCurrentNormalizedAsset(parsed.projectId);
  const normalizedDocument = await readNormalizedDocument(normalizedAsset.source_uri!);
  const report = await generateEditorialAnalysisReport({
    project,
    normalizedAssetId: normalizedAsset.id,
    sourceAssetId: normalizedDocument.source_asset_id,
    document: normalizedDocument,
  });

  const analysisVersion = await getNextAnalysisVersion(parsed.projectId);
  const analysisStoragePath = await uploadAnalysisReport(
    parsed.projectId,
    analysisVersion,
    report
  );

  const { analysisAssetId, transitioned } = await persistAnalysisState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    normalizedAssetId: normalizedAsset.id,
    normalizedAssetVersion: normalizedAsset.version,
    analysisStoragePath,
    report,
    analysisVersion,
  });

  return {
    state: "analyzed",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId,
    analysisAssetUri: analysisStoragePath,
    report,
    transitioned,
  };
}
