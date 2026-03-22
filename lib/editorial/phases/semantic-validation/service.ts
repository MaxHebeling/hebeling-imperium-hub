import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import {
  assertEditorialPolicyAudit,
  buildEditorialPolicyPromptSection,
  buildMergedEditorialProjectPipelineContext,
  getEditorialInterventionLevelForProject,
} from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialProofreadManuscript } from "../proofreading/types";
import {
  assertSemanticValidationState,
  parseEditorialSemanticValidationInput,
} from "./validation";
import { parseSemanticValidationPayload } from "./parser";
import { applyValidationActions, buildEntityRegistry } from "./rules";
import type {
  EditorialSemanticValidationResult,
  EditorialValidatedManuscript,
  EditorialValidationEntity,
  EditorialSemanticIssue,
  EditorialValidatedChapter,
} from "./types";

const VALIDATION_MODEL = "gpt-4o-mini";
const SEMANTIC_VALIDATION_MAX_FULL_TEXT_CHARS = 14_000;
const SEMANTIC_VALIDATION_CHAPTER_HEAD_CHARS = 900;
const SEMANTIC_VALIDATION_CHAPTER_TAIL_CHARS = 450;
const SEMANTIC_VALIDATION_MAX_ENTITY_COUNT = 60;
const SEMANTIC_VALIDATION_MAX_ENTITY_OBSERVED_FORMS = 5;
const SEMANTIC_VALIDATION_MAX_ENTITY_CHAPTER_IDS = 8;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

type WorkflowRow = {
  id: string;
  current_state: string;
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

function buildSemanticValidationPrompt(options: {
  title: string;
  author: string;
  genre: string;
  language: string;
  entityRegistry: EditorialValidationEntity[];
  validationCorpus: string;
  validationCorpusLabel: string;
  chapterMap: Array<{ chapter_id: string; chapter_title: string }>;
  policyPromptSection: string;
}): string {
  return [
    "You are a senior editorial validator.",
    "Validate semantic consistency, contradiction risks, and entity consistency across the manuscript.",
    "You may propose auto-fixes only when they are low-risk and preserve meaning.",
    "Return only valid JSON. No markdown. No explanation outside JSON.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        summary: "string",
        entity_registry: [
          {
            entity: "string",
            kind: "person | location | date | term | organization | unknown",
            canonical_form: "string",
            observed_forms: ["string"],
            chapter_ids: ["string"],
          },
        ],
        issues: [
          {
            category: "consistency | contradiction | entity | timeline",
            severity: "low | medium | high",
            title: "string",
            explanation: "string",
            chapter_ids: ["string"],
            auto_fixable: true,
            suggested_fix: "string or null",
          },
        ],
        chapter_actions: [
          {
            chapter_id: "string",
            summary: "string",
            fixes: [
              {
                category: "consistency | contradiction | entity | timeline",
                title: "string",
                rationale: "string",
                original_excerpt: "string",
                revised_excerpt: "string",
                severity: "low | medium | high",
              },
            ],
          },
        ],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- flag contradictions and entity inconsistencies clearly",
    "- preserve meaning",
    "- only propose auto-fixes when the fix is exact, low-risk, and text-local",
    "- do not invent plot events or facts",
    "",
    "Editorial policy:",
    options.policyPromptSection,
    "",
    `Book title: ${options.title}`,
    `Author: ${options.author}`,
    `Genre: ${options.genre}`,
    `Language: ${options.language}`,
    "",
    "Known entity registry extracted deterministically:",
    JSON.stringify(options.entityRegistry, null, 2),
    "",
    "Chapter map:",
    JSON.stringify(options.chapterMap, null, 2),
    "",
    `${options.validationCorpusLabel}:`,
    options.validationCorpus,
  ].join("\n");
}

function normalizeSemanticValidationText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildSemanticValidationEntityRegistryPreview(
  entityRegistry: EditorialValidationEntity[]
): EditorialValidationEntity[] {
  return entityRegistry.slice(0, SEMANTIC_VALIDATION_MAX_ENTITY_COUNT).map((entity) => ({
    ...entity,
    observed_forms: entity.observed_forms.slice(0, SEMANTIC_VALIDATION_MAX_ENTITY_OBSERVED_FORMS),
    chapter_ids: entity.chapter_ids.slice(0, SEMANTIC_VALIDATION_MAX_ENTITY_CHAPTER_IDS),
  }));
}

function buildSemanticValidationCorpus(
  proofreadManuscript: EditorialProofreadManuscript
): {
  label: string;
  content: string;
} {
  const fullText = normalizeSemanticValidationText(
    proofreadManuscript.full_proofread_text
  );

  if (fullText.length <= SEMANTIC_VALIDATION_MAX_FULL_TEXT_CHARS) {
    return {
      label: "Proofread manuscript",
      content: fullText,
    };
  }

  const digest = proofreadManuscript.chapter_revisions.map((chapter) => {
    const proofreadText = normalizeSemanticValidationText(chapter.proofread_text);
    const excerpt =
      proofreadText.length <=
      SEMANTIC_VALIDATION_CHAPTER_HEAD_CHARS + SEMANTIC_VALIDATION_CHAPTER_TAIL_CHARS
        ? proofreadText
        : [
            proofreadText.slice(0, SEMANTIC_VALIDATION_CHAPTER_HEAD_CHARS).trim(),
            "[...]",
            proofreadText.slice(-SEMANTIC_VALIDATION_CHAPTER_TAIL_CHARS).trim(),
          ]
            .filter(Boolean)
            .join("\n");

    return {
      chapter_id: chapter.chapter_id,
      chapter_title: chapter.chapter_title,
      character_count: proofreadText.length,
      excerpt,
    };
  });

  return {
    label:
      "Condensed manuscript digest (chapter excerpts used to speed up semantic validation)",
    content: JSON.stringify(digest, null, 2),
  };
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
    throw new Error(
      `Failed to load editorial project: ${projectError?.message}`
    );
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(
      `Failed to load editorial workflow: ${workflowError?.message}`
    );
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

async function getCurrentProofreadAsset(projectId: string): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", "proofread_manuscript")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Failed to load proofread_manuscript asset: ${error?.message}`
    );
  }

  if (!data.source_uri) {
    throw new Error("The proofread_manuscript asset does not have a source URI.");
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

  return JSON.parse(
    Buffer.from(await data.arrayBuffer()).toString("utf8")
  ) as T;
}

async function getNextValidatedVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "validated_manuscript")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read validated manuscript versions: ${error.message}`
    );
  }

  return (data?.version ?? 0) + 1;
}

async function runSemanticValidation(options: {
  project: ProjectRow;
  proofreadManuscript: EditorialProofreadManuscript;
  entityRegistry: EditorialValidationEntity[];
  policyPromptSection: string;
}): Promise<{
  summary: string;
  entityRegistry: EditorialValidationEntity[];
  issues: EditorialSemanticIssue[];
  chapterActions: Array<{
    chapter_id: string;
    summary: string;
    fixes: Array<{
      category: "consistency" | "contradiction" | "entity" | "timeline";
      title: string;
      rationale: string;
      original_excerpt: string;
      revised_excerpt: string;
      severity: "low" | "medium" | "high";
    }>;
  }>;
}> {
  const validationCorpus = buildSemanticValidationCorpus(
    options.proofreadManuscript
  );
  const result = await generateText({
    model: openai(VALIDATION_MODEL),
    temperature: 0,
    prompt: buildSemanticValidationPrompt({
      title: options.project.title,
      author: options.project.author ?? "Autor",
      genre: options.project.genre ?? "general",
      language: options.project.language ?? "es",
      entityRegistry: options.entityRegistry,
      validationCorpus: validationCorpus.content,
      validationCorpusLabel: validationCorpus.label,
      chapterMap: options.proofreadManuscript.chapter_revisions.map((chapter) => ({
        chapter_id: chapter.chapter_id,
        chapter_title: chapter.chapter_title,
      })),
      policyPromptSection: options.policyPromptSection,
    }),
  });

  return parseSemanticValidationPayload(result.text);
}

function buildValidatedManuscript(input: {
  projectId: string;
  proofreadAssetId: string;
  proofreadManuscript: EditorialProofreadManuscript;
  entityRegistry: EditorialValidationEntity[];
  issues: EditorialSemanticIssue[];
  chapterRevisions: EditorialValidatedChapter[];
  summary: string;
  generatedAt: string;
}): EditorialValidatedManuscript {
  const fullValidatedText = input.chapterRevisions
    .map((chapter) => chapter.validated_text.trim())
    .filter(Boolean)
    .join("\n\n");

  const appliedFixCount = input.chapterRevisions.reduce(
    (sum, chapter) => sum + chapter.applied_fixes.length,
    0
  );
  const skippedFixCount = input.chapterRevisions.reduce(
    (sum, chapter) => sum + chapter.skipped_fixes.length,
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
    proofread_asset_id: input.proofreadAssetId,
    full_proofread_text: input.proofreadManuscript.full_proofread_text,
    full_validated_text:
      fullValidatedText || input.proofreadManuscript.full_proofread_text,
    entity_registry: input.entityRegistry,
    issues: input.issues,
    chapter_revisions: input.chapterRevisions,
    global_summary: input.summary,
    validation_totals: {
      chapter_count: input.chapterRevisions.length,
      issue_count: input.issues.length,
      auto_fixable_issue_count: input.issues.filter((issue) => issue.auto_fixable)
        .length,
      applied_fix_count: appliedFixCount,
      skipped_fix_count: skippedFixCount,
      average_change_ratio: averageChangeRatio,
    },
    generated_at: input.generatedAt,
    model: VALIDATION_MODEL,
  };
}

async function uploadValidatedManuscript(
  projectId: string,
  version: number,
  validatedManuscript: EditorialValidatedManuscript
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/validated-manuscript/v${version}.json`;
  const buffer = Buffer.from(
    JSON.stringify(validatedManuscript, null, 2),
    "utf8"
  );

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload validated manuscript: ${error.message}`);
  }

  return storagePath;
}

async function persistValidatedState(input: {
  projectId: string;
  workflowId: string;
  currentState: "proofread" | "validated";
  proofreadAssetId: string;
  validatedStoragePath: string;
  validatedManuscript: EditorialValidatedManuscript;
  validatedVersion: number;
}): Promise<{ validatedAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const validatedAssetId = createFoundationId();
  const transitioned = input.currentState === "proofread";

  if (transitioned) {
    validateEditorialWorkflowTransition("proofread", "validated");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "validated_manuscript")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(
      `Failed to clear current validated manuscript asset: ${clearCurrentError.message}`
    );
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: validatedAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "validated_manuscript",
    source_type: "external",
    source_label: `Validated manuscript v${input.validatedVersion}`,
    source_uri: input.validatedStoragePath,
    original_file_name: `validated-manuscript-v${input.validatedVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(
      JSON.stringify(input.validatedManuscript),
      "utf8"
    ),
    extracted_text_uri: null,
    version: input.validatedVersion,
    is_current: true,
    details: {
      model: input.validatedManuscript.model,
      issue_count: input.validatedManuscript.validation_totals.issue_count,
      applied_fix_count:
        input.validatedManuscript.validation_totals.applied_fix_count,
      skipped_fix_count:
        input.validatedManuscript.validation_totals.skipped_fix_count,
      average_change_ratio:
        input.validatedManuscript.validation_totals.average_change_ratio,
      proofread_asset_id: input.proofreadAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(
      `Failed to persist validated manuscript asset: ${assetError.message}`
    );
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "validated",
      context: {
        validated_asset_id: validatedAssetId,
        proofread_asset_id: input.proofreadAssetId,
      },
      metrics: {
        issue_count: input.validatedManuscript.validation_totals.issue_count,
        applied_fix_count:
          input.validatedManuscript.validation_totals.applied_fix_count,
        skipped_fix_count:
          input.validatedManuscript.validation_totals.skipped_fix_count,
        average_change_ratio:
          input.validatedManuscript.validation_totals.average_change_ratio,
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
      current_stage: mapWorkflowStateToLegacyStage("validated"),
      current_status: "validated",
      current_manuscript_asset_id: validatedAssetId,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          semantic_validation_completed: true,
          validated_asset_id: validatedAssetId,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(
      `Failed to update editorial project validated state: ${projectError.message}`
    );
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "validated",
      event_type: "semantic_validation.completed",
      level: "info",
      message: "Semantic validation completed successfully.",
      payload: {
        validatedAssetId,
        issueCount: input.validatedManuscript.validation_totals.issue_count,
        appliedFixCount:
          input.validatedManuscript.validation_totals.applied_fix_count,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "validated",
      event_type: "semantic_validation.entity_registry_built",
      level: "info",
      message: "Entity registry generated for semantic validation.",
      payload: {
        entityCount: input.validatedManuscript.entity_registry.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "validated",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.revalidated",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from proofread to validated."
        : "Semantic validation was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "validated",
        validatedAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase
    .from("pipeline_logs")
    .insert(logs);

  if (logsError) {
    throw new Error(
      `Failed to persist semantic validation logs: ${logsError.message}`
    );
  }

  return { validatedAssetId, transitioned };
}

export async function executeEditorialSemanticValidation(
  input: unknown
): Promise<EditorialSemanticValidationResult> {
  const parsed = parseEditorialSemanticValidationInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertSemanticValidationState(
    workflow.current_state ?? project.current_status
  ) as "proofread" | "validated";
  const interventionLevel = await getEditorialInterventionLevelForProject(
    parsed.projectId
  );
  const policyPromptSection = buildEditorialPolicyPromptSection({
    stage: "semantic_validation",
    level: interventionLevel,
  });

  const proofreadAsset = await getCurrentProofreadAsset(parsed.projectId);
  const proofreadManuscript = await readWorkingJson<EditorialProofreadManuscript>(
    proofreadAsset.source_uri!
  );

  const deterministicEntityRegistry = buildEntityRegistry(
    proofreadManuscript.chapter_revisions
  );

  const semanticValidation = await runSemanticValidation({
    project,
    proofreadManuscript,
    entityRegistry: buildSemanticValidationEntityRegistryPreview(
      deterministicEntityRegistry
    ),
    policyPromptSection,
  });

  const entityRegistry =
    semanticValidation.entityRegistry.length > 0
      ? semanticValidation.entityRegistry
      : deterministicEntityRegistry;

  const effectiveChapterActions =
    interventionLevel === "conservador"
      ? []
      : semanticValidation.chapterActions;

  const chapterRevisions = applyValidationActions({
    chapters: proofreadManuscript.chapter_revisions,
    actions: effectiveChapterActions,
  });

  assertEditorialPolicyAudit({
    stage: "semantic_validation",
    level: interventionLevel,
    items: chapterRevisions.map((chapter) => ({
      label: chapter.chapter_title,
      originalText: chapter.original_text,
      revisedText: chapter.validated_text,
    })),
  });

  const generatedAt = createFoundationTimestamp();
  const validatedManuscript = buildValidatedManuscript({
    projectId: parsed.projectId,
    proofreadAssetId: proofreadAsset.id,
    proofreadManuscript,
    entityRegistry,
    issues: semanticValidation.issues,
    chapterRevisions,
    summary: semanticValidation.summary,
    generatedAt,
  });

  const validatedVersion = await getNextValidatedVersion(parsed.projectId);
  const validatedStoragePath = await uploadValidatedManuscript(
    parsed.projectId,
    validatedVersion,
    validatedManuscript
  );

  const { validatedAssetId, transitioned } = await persistValidatedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    proofreadAssetId: proofreadAsset.id,
    validatedStoragePath,
    validatedManuscript,
    validatedVersion,
  });

  return {
    state: "validated",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    proofreadAssetId: proofreadAsset.id,
    validatedAssetId,
    validatedAssetUri: validatedStoragePath,
    issueCount: validatedManuscript.validation_totals.issue_count,
    appliedFixCount: validatedManuscript.validation_totals.applied_fix_count,
    transitioned,
  };
}
