import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import {
  assertEditorialPolicyAudit,
  buildEditorialPolicyPromptSection,
  buildMergedEditorialProjectPipelineContext,
  getEditorialInterventionLevelForProject,
} from "@/lib/editorial/pipeline/editorial-policy";
import { mapWithConcurrency } from "@/lib/editorial/pipeline/concurrency";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAnalysisReport } from "../analysis/types";
import type { EditorialEditingPlan } from "../editing-plan/types";
import type {
  NormalizedManuscriptBlock,
  NormalizedManuscriptDocument,
} from "../preprocessing/types";
import type {
  EditorialChapterRevision,
  EditorialContentEditingResult,
  EditorialEditedManuscript,
} from "./types";
import { parseChapterRevision } from "./parser";
import {
  assertContentEditingState,
  parseEditorialContentEditingInput,
} from "./validation";

const EDITING_MODEL = "gpt-4o-mini";
const CONTENT_EDITING_BATCH_SIZE = Math.max(
  1,
  Math.min(Number(process.env.EDITORIAL_CONTENT_EDITING_BATCH_SIZE ?? 2), 4)
);
const CONTENT_EDITING_CONCURRENCY = Math.max(
  1,
  Math.min(Number(process.env.EDITORIAL_CONTENT_EDITING_CONCURRENCY ?? 2), 4)
);
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

type WorkflowRow = {
  id: string;
  current_state: string;
  context: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  language: string | null;
  current_status: string | null;
};

type AssetRow = {
  id: string;
  source_uri: string | null;
  version: number;
};

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getEditedDraftStoragePath(projectId: string): string {
  return `${projectId}/edited-manuscript/draft.json`;
}

function getChapterText(
  blocks: NormalizedManuscriptBlock[],
  startBlockIndex: number,
  endBlockIndex: number
): string {
  return blocks
    .slice(startBlockIndex, endBlockIndex + 1)
    .filter((block) => block.kind !== "blank")
    .map((block) => block.text)
    .join("\n\n")
    .trim();
}

function buildChapterEditingPrompt(options: {
  title: string;
  author: string;
  genre: string;
  language: string;
  strategy: string;
  globalObjective: string;
  chapterTitle: string;
  chapterObjective: string;
  focusAreas: string[];
  chapterInstructions: string[];
  reportSummary: string;
  issues: string[];
  chapterText: string;
  policyPromptSection: string;
}): string {
  return [
    "You are a senior developmental editor and line editor.",
    "Rewrite the chapter while preserving meaning, facts, character intent, plot logic, and authorial core voice.",
    "Return only valid JSON. No markdown. No surrounding explanation.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        summary: "string",
        edited_text: "string",
        structure_actions: ["string"],
        tone_alignment_notes: ["string"],
        preservation_notes: ["string"],
        tracked_changes: [
          {
            change_type: "structure | tone | clarity | language",
            title: "string",
            rationale: "string",
            before_excerpt: "string",
            after_excerpt: "string",
            impact: "low | medium | high",
          },
        ],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- preserve meaning",
    "- do not invent plot or claims",
    "- improve structure, clarity, and tone according to the plan",
    "- edited_text must be publication-ready for the next proofreading phase",
    "- tracked_changes should summarize the most meaningful editorial interventions",
    "",
    "Editorial policy:",
    options.policyPromptSection,
    "",
    `Book title: ${options.title}`,
    `Author: ${options.author}`,
    `Genre: ${options.genre}`,
    `Language: ${options.language}`,
    `Strategy: ${options.strategy}`,
    `Global objective: ${options.globalObjective}`,
    `Chapter title: ${options.chapterTitle}`,
    `Chapter objective: ${options.chapterObjective}`,
    `Focus areas: ${options.focusAreas.join(", ")}`,
    "Chapter instructions:",
    options.chapterInstructions.map((item) => `- ${item}`).join("\n"),
    "",
    "Editorial analysis summary:",
    options.reportSummary,
    "",
    "Relevant issues:",
    options.issues.length > 0 ? options.issues.map((item) => `- ${item}`).join("\n") : "- None",
    "",
    "Chapter text:",
    options.chapterText,
  ].join("\n");
}

async function getProjectAndWorkflow(projectId: string): Promise<{
  project: ProjectRow;
  workflow: WorkflowRow;
}> {
  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id, title, author_name, genre, language, current_status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to load editorial project: ${projectError?.message}`);
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state, context")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(`Failed to load editorial workflow: ${workflowError?.message}`);
  }

  return {
    project: {
      id: project.id,
      title: project.title,
      author: (project as { author_name?: string | null }).author_name ?? null,
      genre: project.genre,
      language: project.language,
      current_status: project.current_status,
    },
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentAsset(
  projectId: string,
  assetKind: "normalized_text" | "analysis_output" | "editing_plan"
): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", assetKind)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to load ${assetKind} asset: ${error?.message}`);
  }

  if (!data.source_uri) {
    throw new Error(`The ${assetKind} asset does not have a source URI.`);
  }

  return data as AssetRow;
}

async function readWorkingJson<T>(storagePath: string): Promise<T> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download working asset: ${error?.message}`);
  }

  return JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8")) as T;
}

async function readEditedDraft(
  storagePath: string | null | undefined
): Promise<EditorialEditedManuscript | null> {
  if (!storagePath) {
    return null;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  return JSON.parse(
    Buffer.from(await data.arrayBuffer()).toString("utf8")
  ) as EditorialEditedManuscript;
}

async function getNextEditedVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "edited_manuscript")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read edited manuscript versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function runChapterRewrite(options: {
  project: ProjectRow;
  report: EditorialAnalysisReport;
  plan: EditorialEditingPlan;
  chapterPlan: EditorialEditingPlan["chapter_plan"][number];
  chapterText: string;
  policyPromptSection: string;
}): Promise<EditorialChapterRevision> {
  const relevantIssues = options.report.issues
    .filter((issue) => {
      if (options.plan.strategy === "restructure") {
        return issue.category === "structure" || issue.category === "clarity";
      }
      if (options.plan.strategy === "deep_edit") {
        return issue.category !== "market_fit";
      }
      return issue.category === "clarity" || issue.category === "language";
    })
    .slice(0, 5)
    .map((issue) => `${issue.title}: ${issue.explanation}`);

  const result = await generateText({
    model: openai(EDITING_MODEL),
    temperature: 0,
    prompt: buildChapterEditingPrompt({
      title: options.project.title,
      author: options.project.author ?? "Autor",
      genre: options.project.genre ?? "general",
      language: options.project.language ?? "es",
      strategy: options.plan.strategy,
      globalObjective: options.plan.global_objective,
      chapterTitle: options.chapterPlan.chapter_title,
      chapterObjective: options.chapterPlan.objective,
      focusAreas: options.chapterPlan.focus_areas,
      chapterInstructions: options.chapterPlan.instructions,
      reportSummary: options.report.executive_summary,
      issues: relevantIssues,
      chapterText: options.chapterText,
      policyPromptSection: options.policyPromptSection,
    }),
  });

  return parseChapterRevision({
    chapterId: options.chapterPlan.chapter_id,
    chapterTitle: options.chapterPlan.chapter_title,
    originalText: options.chapterText,
    rawModelText: result.text,
  });
}

function buildStrictPreservationRevision(input: {
  chapterId: string;
  chapterTitle: string;
  chapterText: string;
  plan: EditorialEditingPlan["chapter_plan"][number];
  globalObjective: string;
}): EditorialChapterRevision {
  const wordCount = (input.chapterText.toLowerCase().match(/\p{L}+/gu) ?? []).length;

  return {
    id: createFoundationId(),
    chapter_id: input.chapterId,
    chapter_title: input.chapterTitle,
    original_text: input.chapterText,
    edited_text: input.chapterText,
    summary:
      "Fase resuelta en modo preservación estricta. Se conserva el capítulo intacto y la corrección real se desplaza a la fase lingüística posterior.",
    structure_actions: ["Sin reescritura estructural."],
    tone_alignment_notes: ["Se preserva por completo la voz autoral."],
    preservation_notes: [
      `Objetivo global preservado: ${input.globalObjective}`,
      ...input.plan.focus_areas.map((item) => `Foco preservado: ${item}`),
      ...input.plan.instructions.map((item) => `Instrucción preservada: ${item}`),
    ],
    tracked_changes: [],
    metrics: {
      original_word_count: wordCount,
      edited_word_count: wordCount,
      change_ratio: 0,
    },
  };
}

function buildEditedManuscript(input: {
  projectId: string;
  normalizedAssetId: string;
  analysisAssetId: string;
  editingPlanAssetId: string;
  plan: EditorialEditingPlan;
  document: NormalizedManuscriptDocument;
  chapterRevisions: EditorialChapterRevision[];
  generatedAt: string;
}): EditorialEditedManuscript {
  const fullEditedText = input.chapterRevisions
    .map((chapter) => chapter.edited_text.trim())
    .filter(Boolean)
    .join("\n\n");

  const trackedChangeCount = input.chapterRevisions.reduce(
    (sum, chapter) => sum + chapter.tracked_changes.length,
    0
  );
  const averageChangeRatio =
    input.chapterRevisions.length === 0
      ? 0
      : Number(
          (
            input.chapterRevisions.reduce(
              (sum, chapter) => sum + chapter.metrics.change_ratio,
              0
            ) / input.chapterRevisions.length
          ).toFixed(4)
        );

  return {
    schema_version: 1,
    project_id: input.projectId,
    normalized_asset_id: input.normalizedAssetId,
    analysis_asset_id: input.analysisAssetId,
    editing_plan_asset_id: input.editingPlanAssetId,
    strategy: input.plan.strategy,
    full_original_text: input.document.normalized_text,
    full_edited_text: fullEditedText || input.document.normalized_text,
    chapter_revisions: input.chapterRevisions,
    global_summary: `Edited manuscript generated using strategy ${input.plan.strategy} across ${input.chapterRevisions.length} chapters.`,
    change_totals: {
      chapter_count: input.chapterRevisions.length,
      tracked_change_count: trackedChangeCount,
      average_change_ratio: averageChangeRatio,
    },
    generated_at: input.generatedAt,
    model: EDITING_MODEL,
  };
}

async function uploadEditedManuscript(
  projectId: string,
  version: number,
  editedManuscript: EditorialEditedManuscript
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/edited-manuscript/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(editedManuscript, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload edited manuscript: ${error.message}`);
  }

  return storagePath;
}

async function uploadEditedDraft(
  projectId: string,
  editedManuscript: EditorialEditedManuscript
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = getEditedDraftStoragePath(projectId);
  const buffer = Buffer.from(JSON.stringify(editedManuscript, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload edited manuscript draft: ${error.message}`);
  }

  return storagePath;
}

async function persistEditedProgress(input: {
  projectId: string;
  workflowId: string;
  workflowContext: Record<string, unknown> | null;
  draftStoragePath: string;
  completedChapterCount: number;
  totalChapterCount: number;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const nextWorkflowContext = {
    ...asObject(input.workflowContext),
    content_editing_draft_path: input.draftStoragePath,
    content_editing_completed_chapter_count: input.completedChapterCount,
    content_editing_total_chapter_count: input.totalChapterCount,
  };

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "editing_planned",
      context: nextWorkflowContext,
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to persist content editing progress: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("content_edited"),
      current_status: "editing_planned",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          content_editing_started: true,
          content_editing_completed_chapter_count: input.completedChapterCount,
          content_editing_total_chapter_count: input.totalChapterCount,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(
      `Failed to persist editorial project content editing progress: ${projectError.message}`
    );
  }

  const { error: logsError } = await supabase.from("pipeline_logs").insert({
    id: createFoundationId(),
    project_id: input.projectId,
    workflow_id: input.workflowId,
    stage_id: null,
    stage_key: "editing_planned",
    event_type: "content_editing.batch_completed",
    level: "info",
    message: `Content editing processed ${input.completedChapterCount} of ${input.totalChapterCount} chapters.`,
    payload: {
      completedChapterCount: input.completedChapterCount,
      totalChapterCount: input.totalChapterCount,
      draftStoragePath: input.draftStoragePath,
    },
    created_at: now,
  });

  if (logsError) {
    throw new Error(`Failed to persist content editing progress logs: ${logsError.message}`);
  }
}

async function persistEditedState(input: {
  projectId: string;
  workflowId: string;
  currentState: "editing_planned" | "content_edited";
  normalizedAssetId: string;
  analysisAssetId: string;
  editingPlanAssetId: string;
  editedStoragePath: string;
  editedManuscript: EditorialEditedManuscript;
  editedVersion: number;
}): Promise<{ editedAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const editedAssetId = createFoundationId();
  const transitioned = input.currentState === "editing_planned";

  if (transitioned) {
    validateEditorialWorkflowTransition("editing_planned", "content_edited");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "edited_manuscript")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current edited manuscript asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: editedAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "edited_manuscript",
    source_type: "external",
    source_label: `Edited manuscript v${input.editedVersion}`,
    source_uri: input.editedStoragePath,
    original_file_name: `edited-manuscript-v${input.editedVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.editedManuscript), "utf8"),
    extracted_text_uri: null,
    version: input.editedVersion,
    is_current: true,
    details: {
      model: input.editedManuscript.model,
      strategy: input.editedManuscript.strategy,
      tracked_change_count: input.editedManuscript.change_totals.tracked_change_count,
      chapter_count: input.editedManuscript.change_totals.chapter_count,
      average_change_ratio: input.editedManuscript.change_totals.average_change_ratio,
      normalized_asset_id: input.normalizedAssetId,
      analysis_asset_id: input.analysisAssetId,
      editing_plan_asset_id: input.editingPlanAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist edited manuscript asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "content_edited",
      context: {
        edited_asset_id: editedAssetId,
        editing_plan_asset_id: input.editingPlanAssetId,
        analysis_asset_id: input.analysisAssetId,
        normalized_asset_id: input.normalizedAssetId,
        content_editing_draft_path: null,
        content_editing_completed_chapter_count: null,
        content_editing_total_chapter_count: null,
      },
      metrics: {
        chapter_count: input.editedManuscript.change_totals.chapter_count,
        tracked_change_count: input.editedManuscript.change_totals.tracked_change_count,
        average_change_ratio: input.editedManuscript.change_totals.average_change_ratio,
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
      current_stage: mapWorkflowStateToLegacyStage("content_edited"),
      current_status: "content_edited",
      current_manuscript_asset_id: editedAssetId,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          content_editing_completed: true,
          edited_asset_id: editedAssetId,
          strategy: input.editedManuscript.strategy,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project content editing state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "content_edited",
      event_type: "content_editing.rewrite_completed",
      level: "info",
      message: "AI content editing completed successfully.",
      payload: {
        editedAssetId,
        chapterCount: input.editedManuscript.change_totals.chapter_count,
        trackedChangeCount: input.editedManuscript.change_totals.tracked_change_count,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "content_edited",
      event_type: "content_editing.version_compared",
      level: "info",
      message: "Version comparison metrics were generated for the edited manuscript.",
      payload: {
        averageChangeRatio: input.editedManuscript.change_totals.average_change_ratio,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "content_edited",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.reedited",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from editing_planned to content_edited."
        : "Content editing was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "content_edited",
        editedAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist content editing logs: ${logsError.message}`);
  }

  return { editedAssetId, transitioned };
}

export async function executeEditorialContentEditing(
  input: unknown
): Promise<EditorialContentEditingResult> {
  const parsed = parseEditorialContentEditingInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertContentEditingState(
    workflow.current_state ?? project.current_status
  ) as "editing_planned" | "content_edited";
  const interventionLevel = await getEditorialInterventionLevelForProject(
    parsed.projectId
  );
  const policyPromptSection = buildEditorialPolicyPromptSection({
    stage: "content_editing",
    level: interventionLevel,
  });

  const normalizedAsset = await getCurrentAsset(parsed.projectId, "normalized_text");
  const analysisAsset = await getCurrentAsset(parsed.projectId, "analysis_output");
  const editingPlanAsset = await getCurrentAsset(parsed.projectId, "editing_plan");

  const normalizedDocument = await readWorkingJson<NormalizedManuscriptDocument>(
    normalizedAsset.source_uri!
  );
  const analysisReport = await readWorkingJson<EditorialAnalysisReport>(
    analysisAsset.source_uri!
  );
  const editingPlan = await readWorkingJson<EditorialEditingPlan>(
    editingPlanAsset.source_uri!
  );

  const chapterInputs = editingPlan.chapter_plan
    .map((chapterPlan) => {
      const chapter = normalizedDocument.chapters.find(
        (item) => item.id === chapterPlan.chapter_id
      );
      if (!chapter) {
        return null;
      }

      return {
        chapterPlan,
        chapterText: getChapterText(
          normalizedDocument.blocks,
          chapter.start_block_index,
          chapter.end_block_index
        ),
      };
    })
    .filter(
      (
        value
      ): value is {
        chapterPlan: EditorialEditingPlan["chapter_plan"][number];
        chapterText: string;
      } => value !== null
    );
  const chapterRevisions = chapterInputs.map(({ chapterPlan, chapterText }) =>
    buildStrictPreservationRevision({
      chapterId: chapterPlan.chapter_id,
      chapterTitle: chapterPlan.chapter_title,
      chapterText,
      plan: chapterPlan,
      globalObjective: editingPlan.global_objective,
    })
  );

  assertEditorialPolicyAudit({
    stage: "content_editing",
    level: interventionLevel,
    items: chapterRevisions.map((chapter) => ({
      label: chapter.chapter_title,
      originalText: chapter.original_text,
      revisedText: chapter.edited_text,
    })),
  });

  const generatedAt = createFoundationTimestamp();
  const editedManuscript = buildEditedManuscript({
    projectId: parsed.projectId,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    editingPlanAssetId: editingPlanAsset.id,
    plan: editingPlan,
    document: normalizedDocument,
    chapterRevisions,
    generatedAt,
  });

  const editedVersion = await getNextEditedVersion(parsed.projectId);
  const editedStoragePath = await uploadEditedManuscript(
    parsed.projectId,
    editedVersion,
    editedManuscript
  );

  const { editedAssetId, transitioned } = await persistEditedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    editingPlanAssetId: editingPlanAsset.id,
    editedStoragePath,
    editedManuscript,
    editedVersion,
  });

  return {
    state: "content_edited",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    normalizedAssetId: normalizedAsset.id,
    analysisAssetId: analysisAsset.id,
    editingPlanAssetId: editingPlanAsset.id,
    editedAssetId,
    editedAssetUri: editedStoragePath,
    chapterCount: editedManuscript.change_totals.chapter_count,
    trackedChangeCount: editedManuscript.change_totals.tracked_change_count,
    transitioned,
  };
}
