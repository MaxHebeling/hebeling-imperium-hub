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
import { mapWithConcurrency } from "@/lib/editorial/pipeline/concurrency";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import {
  applyAutoCorrections,
  isLanguageToolAvailable,
  runLanguageToolCorrection,
  type LanguageToolCorrection,
} from "@/lib/editorial/ai/languagetool";
import type { EditorialInterventionLevel } from "@/lib/editorial/types/editorial";
import type { EditorialEditedManuscript } from "../content-editing/types";
import {
  assertProofreadingState,
  parseEditorialProofreadingInput,
} from "./validation";
import { parseProofreadChapter } from "./parser";
import { buildEditorialStyleProfile } from "./rules";
import type {
  EditorialProofreadChapter,
  EditorialProofreadingResult,
  EditorialProofreadManuscript,
  EditorialProofreadingCategory,
  EditorialStyleProfile,
} from "./types";

const PROOFREADING_FALLBACK_MODEL = "gpt-4o-mini";
const PROOFREADING_MODEL = isLanguageToolAvailable()
  ? "languagetool"
  : PROOFREADING_FALLBACK_MODEL;
const PROOFREADING_BATCH_SIZE = Math.max(
  1,
  Math.min(Number(process.env.EDITORIAL_PROOFREADING_BATCH_SIZE ?? 1), 4)
);
const PROOFREADING_CONCURRENCY = Math.max(
  1,
  Math.min(Number(process.env.EDITORIAL_PROOFREADING_CONCURRENCY ?? 1), 4)
);
const PROOFREADING_LANGUAGETOOL_BUNDLE_SIZE = Math.max(
  500,
  Math.min(
    Number(process.env.EDITORIAL_PROOFREADING_LANGUAGETOOL_BUNDLE_SIZE ?? 1200),
    4000
  )
);
const PROOFREADING_LANGUAGETOOL_AUTO_PASSES = Math.max(
  1,
  Math.min(
    Number(process.env.EDITORIAL_PROOFREADING_LANGUAGETOOL_AUTO_PASSES ?? 3),
    5
  )
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

type EditableChapterInput = {
  chapter_id: string;
  chapter_title: string;
  edited_text: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getProofreadDraftStoragePath(projectId: string): string {
  return `${projectId}/proofread-manuscript/draft.json`;
}

function buildProofreadingPrompt(options: {
  title: string;
  author: string;
  genre: string;
  language: string;
  toneTarget: string;
  styleNotes: string[];
  rules: EditorialStyleProfile["rules"];
  chapterTitle: string;
  chapterText: string;
  policyPromptSection: string;
}): string {
  return [
    "You are a senior proofreader and copy editor.",
    "Correct grammar, spelling, punctuation, and style consistency only.",
    "Preserve meaning, narrative intent, facts, and voice.",
    "Do not rewrite the chapter structurally and do not invent content.",
    "Return only valid JSON. No markdown. No explanation outside JSON.",
    "",
    "Editorial policy:",
    options.policyPromptSection,
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        summary: "string",
        proofread_text: "string",
        applied_rules: ["string"],
        editorial_flags: ["string"],
        changes: [
          {
            category: "grammar | spelling | punctuation | style | consistency",
            title: "string",
            rationale: "string",
            before_excerpt: "string",
            after_excerpt: "string",
            severity: "low | medium | high",
          },
        ],
      },
      null,
      2
    ),
    "",
    `Book title: ${options.title}`,
    `Author: ${options.author}`,
    `Genre: ${options.genre}`,
    `Language: ${options.language}`,
    `Tone target: ${options.toneTarget}`,
    `Chapter title: ${options.chapterTitle}`,
    "Style notes:",
    options.styleNotes.map((note) => `- ${note}`).join("\n"),
    "",
    "Editorial rules:",
    options.rules
      .map(
        (rule) =>
          `- [${rule.priority}] ${rule.label}: ${rule.description}`
      )
      .join("\n"),
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
    throw new Error(
      `Failed to load editorial project: ${projectError?.message}`
    );
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state, context")
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

async function getCurrentEditedAsset(projectId: string): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", "edited_manuscript")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Failed to load edited_manuscript asset: ${error?.message}`
    );
  }

  if (!data.source_uri) {
    throw new Error("The edited_manuscript asset does not have a source URI.");
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

async function readProofreadDraft(
  storagePath: string | null | undefined
): Promise<EditorialProofreadManuscript | null> {
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
  ) as EditorialProofreadManuscript;
}

function getEditableChapters(
  editedManuscript: EditorialEditedManuscript
): EditableChapterInput[] {
  if (editedManuscript.chapter_revisions.length > 0) {
    return editedManuscript.chapter_revisions.map((chapter) => ({
      chapter_id: chapter.chapter_id,
      chapter_title: chapter.chapter_title,
      edited_text: chapter.edited_text,
    }));
  }

  return [
    {
      chapter_id: createFoundationId(),
      chapter_title: "Full manuscript",
      edited_text: editedManuscript.full_edited_text,
    },
  ];
}

async function getNextProofreadVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "proofread_manuscript")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read proofread manuscript versions: ${error.message}`
    );
  }

  return (data?.version ?? 0) + 1;
}

function countWords(text: string): number {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).length;
}

function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/\p{L}+/gu) ?? [];
}

function normalizeSimilarityText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildCharacterBigrams(text: string): string[] {
  if (text.length < 2) {
    return text.length === 0 ? [] : [text];
  }

  const bigrams: string[] = [];
  for (let index = 0; index < text.length - 1; index += 1) {
    bigrams.push(text.slice(index, index + 2));
  }
  return bigrams;
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1).fill(0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) {
      previous[rightIndex] = current[rightIndex] ?? 0;
    }
  }

  return previous[right.length] ?? 0;
}

function isSingleWord(text: string): boolean {
  return /^\p{L}+$/u.test(text.trim());
}

function isOrthographicLanguageToolCorrection(
  correction: LanguageToolCorrection
): boolean {
  const category = correction.category.toLowerCase();
  const issueType = correction.issueType.toLowerCase();
  const ruleId = correction.ruleId.toLowerCase();

  return (
    issueType.includes("misspell") ||
    issueType.includes("typo") ||
    category.includes("ortogr") ||
    category.includes("diacr") ||
    ruleId.includes("morfologik") ||
    ruleId.includes("diacritic")
  );
}

function isObjectiveLanguageToolCorrection(
  correction: LanguageToolCorrection
): boolean {
  const replacement = correction.suggestions[0]?.trim();
  const original = correction.original.trim();

  if (!replacement) {
    return false;
  }

  if (correction.issueType === "style") {
    return false;
  }

  const normalizedOriginal = normalizeSimilarityText(original);
  const normalizedReplacement = normalizeSimilarityText(replacement);

  if (!normalizedOriginal || !normalizedReplacement) {
    return false;
  }

  if (normalizedOriginal === normalizedReplacement) {
    return true;
  }

  const compactOriginal = normalizedOriginal.replace(/\s+/g, "");
  const compactReplacement = normalizedReplacement.replace(/\s+/g, "");

  if (compactOriginal === compactReplacement) {
    return true;
  }

  if (correction.suggestions.length > 1 && !isOrthographicLanguageToolCorrection(correction)) {
    return false;
  }

  if (!isSingleWord(normalizedOriginal) || !isSingleWord(normalizedReplacement)) {
    return false;
  }

  const maxLength = Math.max(normalizedOriginal.length, normalizedReplacement.length);
  const distance = levenshteinDistance(
    normalizedOriginal,
    normalizedReplacement
  );

  return distance <= Math.max(2, Math.floor(maxLength * 0.25));
}

function buildParagraphBatches(paragraphs: string[]): string[][] {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    const nextLength =
      currentBatch.length === 0
        ? paragraph.length
        : currentLength + 2 + paragraph.length;

    if (
      currentBatch.length > 0 &&
      nextLength > PROOFREADING_LANGUAGETOOL_BUNDLE_SIZE
    ) {
      batches.push(currentBatch);
      currentBatch = [paragraph];
      currentLength = paragraph.length;
      continue;
    }

    currentBatch.push(paragraph);
    currentLength = nextLength;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

function getProofreadingParagraphGuard(level: EditorialInterventionLevel): {
  maxParagraphDeltaRatio: number;
  minParagraphSimilarityRatio: number;
} {
  switch (level) {
    case "editorial":
      return {
        maxParagraphDeltaRatio: 0.1,
        minParagraphSimilarityRatio: 0.88,
      };
    case "intervencion_alta":
      return {
        maxParagraphDeltaRatio: 0.16,
        minParagraphSimilarityRatio: 0.8,
      };
    case "conservador":
    default:
      return {
        maxParagraphDeltaRatio: 0.06,
        minParagraphSimilarityRatio: 0.85,
      };
  }
}

function computeParagraphSimilarity(originalText: string, revisedText: string): number {
  const normalizedOriginal = normalizeSimilarityText(originalText);
  const normalizedRevised = normalizeSimilarityText(revisedText);

  if (normalizedOriginal.length === 0 && normalizedRevised.length === 0) {
    return 1;
  }

  if (normalizedOriginal.length === 0 || normalizedRevised.length === 0) {
    return 0;
  }

  const originalBigrams = buildCharacterBigrams(normalizedOriginal);
  const revisedBigrams = buildCharacterBigrams(normalizedRevised);

  if (originalBigrams.length === 0 && revisedBigrams.length === 0) {
    return 1;
  }

  if (originalBigrams.length === 0 || revisedBigrams.length === 0) {
    return 0;
  }

  const revisedCounts = new Map<string, number>();
  for (const bigram of revisedBigrams) {
    revisedCounts.set(bigram, (revisedCounts.get(bigram) ?? 0) + 1);
  }

  let intersectionCount = 0;
  for (const bigram of originalBigrams) {
    const count = revisedCounts.get(bigram) ?? 0;
    if (count > 0) {
      intersectionCount += 1;
      revisedCounts.set(bigram, count - 1);
    }
  }

  return (2 * intersectionCount) / (originalBigrams.length + revisedBigrams.length);
}

function preserveParagraphWhenNeeded(options: {
  originalParagraph: string;
  revisedParagraph: string;
  level: EditorialInterventionLevel;
}): { paragraphText: string; preservedOriginal: boolean } {
  const guard = getProofreadingParagraphGuard(options.level);
  const originalWordCount = tokenizeWords(options.originalParagraph).length;
  const revisedWordCount = tokenizeWords(options.revisedParagraph).length;
  const paragraphDeltaRatio =
    originalWordCount === 0
      ? revisedWordCount === 0
        ? 0
        : 1
      : Math.abs(revisedWordCount - originalWordCount) / originalWordCount;
  const paragraphSimilarity = computeParagraphSimilarity(
    options.originalParagraph,
    options.revisedParagraph
  );

  if (
    paragraphDeltaRatio > guard.maxParagraphDeltaRatio ||
    paragraphSimilarity < guard.minParagraphSimilarityRatio
  ) {
    return {
      paragraphText: options.originalParagraph,
      preservedOriginal: true,
    };
  }

  return {
    paragraphText: options.revisedParagraph,
    preservedOriginal: false,
  };
}

function resolveLanguageToolLanguage(
  language: string | null | undefined
): "es" | "en-US" | "auto" {
  if (!language) {
    return "auto";
  }

  const normalized = language.toLowerCase();
  if (normalized.startsWith("es")) {
    return "es";
  }
  if (normalized.startsWith("en")) {
    return "en-US";
  }

  return "auto";
}

function mapLanguageToolCategory(
  correction: LanguageToolCorrection
): EditorialProofreadingCategory {
  const issueType = correction.issueType.toLowerCase();
  const category = correction.category.toLowerCase();

  if (issueType.includes("spell") || category.includes("spell")) {
    return "spelling";
  }
  if (issueType.includes("punct") || category.includes("punct")) {
    return "punctuation";
  }
  if (issueType.includes("style") || category.includes("style")) {
    return "style";
  }
  if (issueType.includes("typo")) {
    return "punctuation";
  }
  if (issueType.includes("grammar") || category.includes("grammar")) {
    return "grammar";
  }

  return "consistency";
}

function filterSafeAutoCorrections(
  corrections: LanguageToolCorrection[]
): LanguageToolCorrection[] {
  return corrections.filter((correction) => {
    if (correction.original.includes("\n")) {
      return false;
    }

    return !correction.suggestions.some((suggestion) => suggestion.includes("\n"));
  });
}

async function proofreadLanguageToolSegment(options: {
  text: string;
  language: "es" | "en-US" | "auto";
}): Promise<{
  proofreadText: string;
  appliedCorrections: LanguageToolCorrection[];
  skippedCount: number;
}> {
  let currentText = options.text;
  const appliedCorrections: LanguageToolCorrection[] = [];
  let skippedCount = 0;

  for (
    let passIndex = 0;
    passIndex < PROOFREADING_LANGUAGETOOL_AUTO_PASSES;
    passIndex += 1
  ) {
    const correctionResult = await runLanguageToolCorrection(
      currentText,
      options.language
    );
    const safeCorrections = filterSafeAutoCorrections(correctionResult.corrections);
    const passAppliedCorrections = safeCorrections.filter(
      isObjectiveLanguageToolCorrection
    );

    skippedCount += correctionResult.corrections.length - passAppliedCorrections.length;

    if (passAppliedCorrections.length === 0) {
      break;
    }

    const { correctedText } = applyAutoCorrections(currentText, passAppliedCorrections, {
      onlyHighConfidence: false,
    });

    if (!correctedText || correctedText === currentText) {
      break;
    }

    appliedCorrections.push(...passAppliedCorrections);
    currentText = correctedText;
  }

  return {
    proofreadText: currentText || options.text,
    appliedCorrections,
    skippedCount,
  };
}

async function proofreadLanguageToolChapterText(options: {
  chapterText: string;
  language: "es" | "en-US" | "auto";
  interventionLevel: EditorialInterventionLevel;
}): Promise<{
  proofreadText: string;
  appliedCorrections: LanguageToolCorrection[];
  skippedCount: number;
}> {
  const normalizedText = options.chapterText.replace(/\r\n/g, "\n").trim();
  const paragraphs = splitParagraphs(normalizedText);

  if (paragraphs.length <= 1) {
    const singleResult = await proofreadLanguageToolSegment({
      text: normalizedText || options.chapterText,
      language: options.language,
    });
    const preserved = preserveParagraphWhenNeeded({
      originalParagraph: normalizedText || options.chapterText,
      revisedParagraph:
        singleResult.proofreadText.trim() || normalizedText || options.chapterText,
      level: options.interventionLevel,
    });

    return {
      proofreadText: preserved.paragraphText,
      appliedCorrections: preserved.preservedOriginal
        ? []
        : singleResult.appliedCorrections,
      skippedCount:
        singleResult.skippedCount +
        (preserved.preservedOriginal ? singleResult.appliedCorrections.length : 0),
    };
  }

  const batches = buildParagraphBatches(paragraphs);
  const correctedParagraphs: string[] = [];
  const appliedCorrections: LanguageToolCorrection[] = [];
  let skippedCount = 0;

  for (const batch of batches) {
    const batchText = batch.join("\n\n");
    const batchResult = await proofreadLanguageToolSegment({
      text: batchText,
      language: options.language,
    });
    const correctedBatchParagraphs = splitParagraphs(batchResult.proofreadText);

    if (correctedBatchParagraphs.length !== batch.length) {
      for (const paragraph of batch) {
        const paragraphResult = await proofreadLanguageToolSegment({
          text: paragraph,
          language: options.language,
        });
        const preserved = preserveParagraphWhenNeeded({
          originalParagraph: paragraph,
          revisedParagraph: paragraphResult.proofreadText.trim() || paragraph,
          level: options.interventionLevel,
        });
        correctedParagraphs.push(preserved.paragraphText);
        if (!preserved.preservedOriginal) {
          appliedCorrections.push(...paragraphResult.appliedCorrections);
        }
        skippedCount +=
          paragraphResult.skippedCount +
          (preserved.preservedOriginal
            ? paragraphResult.appliedCorrections.length
            : 0);
      }
      continue;
    }

    let requiresParagraphFallback = false;
    for (let paragraphIndex = 0; paragraphIndex < batch.length; paragraphIndex += 1) {
      const originalParagraph = batch[paragraphIndex] ?? "";
      const correctedParagraph = correctedBatchParagraphs[paragraphIndex] ?? "";
      const preserved = preserveParagraphWhenNeeded({
        originalParagraph,
        revisedParagraph: correctedParagraph,
        level: options.interventionLevel,
      });

      if (preserved.preservedOriginal) {
        requiresParagraphFallback = true;
        break;
      }
    }

    if (requiresParagraphFallback) {
      for (const paragraph of batch) {
        const paragraphResult = await proofreadLanguageToolSegment({
          text: paragraph,
          language: options.language,
        });
        const preserved = preserveParagraphWhenNeeded({
          originalParagraph: paragraph,
          revisedParagraph: paragraphResult.proofreadText.trim() || paragraph,
          level: options.interventionLevel,
        });
        correctedParagraphs.push(preserved.paragraphText);
        if (!preserved.preservedOriginal) {
          appliedCorrections.push(...paragraphResult.appliedCorrections);
        }
        skippedCount +=
          paragraphResult.skippedCount +
          (preserved.preservedOriginal
            ? paragraphResult.appliedCorrections.length
            : 0);
      }
      continue;
    }

    correctedParagraphs.push(...correctedBatchParagraphs);
    appliedCorrections.push(...batchResult.appliedCorrections);
    skippedCount += batchResult.skippedCount;
  }

  const proofreadText = correctedParagraphs.join("\n\n").trim();

  return {
    proofreadText: proofreadText || normalizedText || options.chapterText,
    appliedCorrections,
    skippedCount,
  };
}

function buildLanguageToolProofreadChapter(input: {
  chapter: EditableChapterInput;
  proofreadText: string;
  appliedCorrections: LanguageToolCorrection[];
  skippedCount: number;
}): EditorialProofreadChapter {
  const proofreadText = input.proofreadText.trim() || input.chapter.edited_text;
  const originalWordCount = countWords(input.chapter.edited_text);
  const proofreadWordCount = countWords(proofreadText);
  const changeRatio =
    originalWordCount === 0
      ? 0
      : Math.min(
          1,
          Math.abs(proofreadWordCount - originalWordCount) / originalWordCount
        );

  return {
    id: createFoundationId(),
    chapter_id: input.chapter.chapter_id,
    chapter_title: input.chapter.chapter_title,
    original_text: input.chapter.edited_text,
    proofread_text: proofreadText,
    summary:
      input.appliedCorrections.length > 0
        ? `LanguageTool aplicó ${input.appliedCorrections.length} correcciones automáticas de alta confianza.`
        : "LanguageTool no detectó correcciones seguras; se conserva el texto editado.",
    applied_rules: Array.from(
      new Set(
        input.appliedCorrections.slice(0, 25).map((correction) => correction.ruleId)
      )
    ),
    editorial_flags:
      input.skippedCount > 0
        ? [
            `Se omitieron ${input.skippedCount} sugerencias de baja confianza o de estilo subjetivo para preservar el manuscrito.`,
          ]
        : [],
    changes: input.appliedCorrections.slice(0, 200).map((correction) => ({
      id: createFoundationId(),
      chapter_id: input.chapter.chapter_id,
      category: mapLanguageToolCategory(correction),
      title: correction.shortMessage || correction.message,
      rationale: correction.message,
      before_excerpt: correction.original,
      after_excerpt: correction.suggestions[0] ?? correction.original,
      severity: "low",
    })),
    metrics: {
      original_word_count: originalWordCount,
      proofread_word_count: proofreadWordCount,
      change_ratio: Number(changeRatio.toFixed(4)),
    },
  };
}

async function runChapterProofreading(options: {
  project: ProjectRow;
  styleProfile: EditorialStyleProfile;
  chapter: EditableChapterInput;
  policyPromptSection: string;
  interventionLevel: EditorialInterventionLevel;
}): Promise<EditorialProofreadChapter> {
  if (isLanguageToolAvailable()) {
    const language = resolveLanguageToolLanguage(options.project.language);
    const proofreadResult = await proofreadLanguageToolChapterText({
      chapterText: options.chapter.edited_text,
      language,
      interventionLevel: options.interventionLevel,
    });

    return buildLanguageToolProofreadChapter({
      chapter: options.chapter,
      proofreadText: proofreadResult.proofreadText,
      appliedCorrections: proofreadResult.appliedCorrections,
      skippedCount: proofreadResult.skippedCount,
    });
  }

  const result = await generateText({
    model: openai(PROOFREADING_FALLBACK_MODEL),
    temperature: 0,
    prompt: buildProofreadingPrompt({
      title: options.project.title,
      author: options.project.author ?? "Autor",
      genre: options.project.genre ?? "general",
      language: options.project.language ?? "es",
      toneTarget: options.styleProfile.tone_target,
      styleNotes: options.styleProfile.style_notes,
      rules: options.styleProfile.rules,
      chapterTitle: options.chapter.chapter_title,
      chapterText: options.chapter.edited_text,
      policyPromptSection: options.policyPromptSection,
    }),
  });

  return parseProofreadChapter({
    chapterId: options.chapter.chapter_id,
    chapterTitle: options.chapter.chapter_title,
    editedText: options.chapter.edited_text,
    rawModelText: result.text,
  });
}

function buildProofreadManuscript(input: {
  projectId: string;
  editedAssetId: string;
  editedManuscript: EditorialEditedManuscript;
  styleProfile: EditorialStyleProfile;
  chapterRevisions: EditorialProofreadChapter[];
  generatedAt: string;
}): EditorialProofreadManuscript {
  const fullProofreadText = input.chapterRevisions
    .map((chapter) => chapter.proofread_text.trim())
    .filter(Boolean)
    .join("\n\n");

  const correctionCount = input.chapterRevisions.reduce(
    (sum, chapter) => sum + chapter.changes.length,
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
    edited_asset_id: input.editedAssetId,
    style_profile: input.styleProfile,
    full_edited_text: input.editedManuscript.full_edited_text,
    full_proofread_text:
      fullProofreadText || input.editedManuscript.full_edited_text,
    chapter_revisions: input.chapterRevisions,
    global_summary: `Proofreading completed across ${input.chapterRevisions.length} chapters using ${input.styleProfile.rules.length} editorial rules.`,
    change_totals: {
      chapter_count: input.chapterRevisions.length,
      correction_count: correctionCount,
      average_change_ratio: averageChangeRatio,
    },
    generated_at: input.generatedAt,
    model: PROOFREADING_MODEL,
    rules_version: 1,
  };
}

async function uploadProofreadManuscript(
  projectId: string,
  version: number,
  proofreadManuscript: EditorialProofreadManuscript
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/proofread-manuscript/v${version}.json`;
  const buffer = Buffer.from(
    JSON.stringify(proofreadManuscript, null, 2),
    "utf8"
  );

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload proofread manuscript: ${error.message}`);
  }

  return storagePath;
}

async function uploadProofreadDraft(
  projectId: string,
  proofreadManuscript: EditorialProofreadManuscript
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = getProofreadDraftStoragePath(projectId);
  const buffer = Buffer.from(
    JSON.stringify(proofreadManuscript, null, 2),
    "utf8"
  );

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload proofread draft: ${error.message}`);
  }

  return storagePath;
}

async function persistProofreadingProgress(input: {
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
    proofreading_draft_path: input.draftStoragePath,
    proofreading_completed_chapter_count: input.completedChapterCount,
    proofreading_total_chapter_count: input.totalChapterCount,
  };

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "content_edited",
      context: nextWorkflowContext,
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to persist proofreading progress: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("proofread"),
      current_status: "content_edited",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          proofreading_started: true,
          proofreading_completed_chapter_count: input.completedChapterCount,
          proofreading_total_chapter_count: input.totalChapterCount,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(
      `Failed to persist editorial project proofreading progress: ${projectError.message}`
    );
  }

  const { error: logsError } = await supabase.from("pipeline_logs").insert({
    id: createFoundationId(),
    project_id: input.projectId,
    workflow_id: input.workflowId,
    stage_id: null,
    stage_key: "content_edited",
    event_type: "proofreading.batch_completed",
    level: "info",
    message: `Proofreading processed ${input.completedChapterCount} of ${input.totalChapterCount} chapters.`,
    payload: {
      completedChapterCount: input.completedChapterCount,
      totalChapterCount: input.totalChapterCount,
      draftStoragePath: input.draftStoragePath,
    },
    created_at: now,
  });

  if (logsError) {
    throw new Error(`Failed to persist proofreading progress logs: ${logsError.message}`);
  }
}

async function persistProofreadState(input: {
  projectId: string;
  workflowId: string;
  currentState: "content_edited" | "proofread";
  editedAssetId: string;
  proofreadStoragePath: string;
  proofreadManuscript: EditorialProofreadManuscript;
  proofreadVersion: number;
}): Promise<{ proofreadAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const proofreadAssetId = createFoundationId();
  const transitioned = input.currentState === "content_edited";

  if (transitioned) {
    validateEditorialWorkflowTransition("content_edited", "proofread");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "proofread_manuscript")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(
      `Failed to clear current proofread manuscript asset: ${clearCurrentError.message}`
    );
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: proofreadAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "proofread_manuscript",
    source_type: "external",
    source_label: `Proofread manuscript v${input.proofreadVersion}`,
    source_uri: input.proofreadStoragePath,
    original_file_name: `proofread-manuscript-v${input.proofreadVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(
      JSON.stringify(input.proofreadManuscript),
      "utf8"
    ),
    extracted_text_uri: null,
    version: input.proofreadVersion,
    is_current: true,
    details: {
      model: input.proofreadManuscript.model,
      correction_count: input.proofreadManuscript.change_totals.correction_count,
      chapter_count: input.proofreadManuscript.change_totals.chapter_count,
      average_change_ratio:
        input.proofreadManuscript.change_totals.average_change_ratio,
      rules_version: input.proofreadManuscript.rules_version,
      edited_asset_id: input.editedAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(
      `Failed to persist proofread manuscript asset: ${assetError.message}`
    );
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "proofread",
      context: {
        proofread_asset_id: proofreadAssetId,
        edited_asset_id: input.editedAssetId,
        proofreading_draft_path: null,
        proofreading_completed_chapter_count: null,
        proofreading_total_chapter_count: null,
      },
      metrics: {
        chapter_count: input.proofreadManuscript.change_totals.chapter_count,
        correction_count: input.proofreadManuscript.change_totals.correction_count,
        average_change_ratio:
          input.proofreadManuscript.change_totals.average_change_ratio,
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
      current_stage: mapWorkflowStateToLegacyStage("proofread"),
      current_status: "proofread",
      current_manuscript_asset_id: proofreadAssetId,
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          proofreading_completed: true,
          proofread_asset_id: proofreadAssetId,
          rules_version: input.proofreadManuscript.rules_version,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(
      `Failed to update editorial project proofreading state: ${projectError.message}`
    );
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "proofread",
      event_type: "proofreading.completed",
      level: "info",
      message: "Proofreading completed successfully.",
      payload: {
        proofreadAssetId,
        chapterCount: input.proofreadManuscript.change_totals.chapter_count,
        correctionCount:
          input.proofreadManuscript.change_totals.correction_count,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "proofread",
      event_type: "proofreading.rules_applied",
      level: "info",
      message: "Editorial style rules were applied during proofreading.",
      payload: {
        rulesVersion: input.proofreadManuscript.rules_version,
        ruleCount: input.proofreadManuscript.style_profile.rules.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "proofread",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.reproofread",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from content_edited to proofread."
        : "Proofreading was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "proofread",
        proofreadAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase
    .from("pipeline_logs")
    .insert(logs);

  if (logsError) {
    throw new Error(
      `Failed to persist proofreading logs: ${logsError.message}`
    );
  }

  return { proofreadAssetId, transitioned };
}

export async function executeEditorialProofreading(
  input: unknown
): Promise<EditorialProofreadingResult> {
  const parsed = parseEditorialProofreadingInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertProofreadingState(
    workflow.current_state ?? project.current_status
  ) as "content_edited" | "proofread";
  const interventionLevel = await getEditorialInterventionLevelForProject(
    parsed.projectId
  );
  const policyPromptSection = buildEditorialPolicyPromptSection({
    stage: "proofreading",
    level: interventionLevel,
  });

  const editedAsset = await getCurrentEditedAsset(parsed.projectId);
  const editedManuscript = await readWorkingJson<EditorialEditedManuscript>(
    editedAsset.source_uri!
  );

  const styleProfile = buildEditorialStyleProfile({
    language: project.language,
    genre: project.genre,
  });

  const existingDraft = await readProofreadDraft(
    typeof asObject(workflow.context).proofreading_draft_path === "string"
      ? (asObject(workflow.context).proofreading_draft_path as string)
      : null
  );
  const existingRevisionMap = new Map(
    (existingDraft?.chapter_revisions ?? []).map((revision) => [
      revision.chapter_id,
      revision,
    ])
  );
  const chapterInputs = getEditableChapters(editedManuscript);
  const pendingChapterInputs = chapterInputs.filter(
    (chapter) => !existingRevisionMap.has(chapter.chapter_id)
  );
  const batchChapterInputs = pendingChapterInputs.slice(0, PROOFREADING_BATCH_SIZE);
  const batchRevisions = await mapWithConcurrency(
    batchChapterInputs,
    PROOFREADING_CONCURRENCY,
    (chapter) =>
      runChapterProofreading({
        project,
        styleProfile,
        chapter,
        policyPromptSection,
        interventionLevel,
      })
  );
  for (const revision of batchRevisions) {
    existingRevisionMap.set(revision.chapter_id, revision);
  }

  const chapterRevisions = chapterInputs
    .map((chapter) => existingRevisionMap.get(chapter.chapter_id) ?? null)
    .filter(
      (revision): revision is EditorialProofreadChapter => revision !== null
    );

  if (chapterRevisions.length < chapterInputs.length) {
    const partialDraft = buildProofreadManuscript({
      projectId: parsed.projectId,
      editedAssetId: editedAsset.id,
      editedManuscript,
      styleProfile,
      chapterRevisions,
      generatedAt: createFoundationTimestamp(),
    });
    const draftStoragePath = await uploadProofreadDraft(parsed.projectId, partialDraft);
    await persistProofreadingProgress({
      projectId: parsed.projectId,
      workflowId: workflow.id,
      workflowContext: workflow.context,
      draftStoragePath,
      completedChapterCount: chapterRevisions.length,
      totalChapterCount: chapterInputs.length,
    });

    return {
      state: "content_edited",
      projectId: parsed.projectId,
      workflowId: workflow.id,
      editedAssetId: editedAsset.id,
      partial: true,
      processedChapterCount: chapterRevisions.length,
      remainingChapterCount: chapterInputs.length - chapterRevisions.length,
    };
  }

  assertEditorialPolicyAudit({
    stage: "proofreading",
    level: interventionLevel,
    items: chapterRevisions.map((chapter) => ({
      label: chapter.chapter_title,
      originalText: chapter.original_text,
      revisedText: chapter.proofread_text,
    })),
  });

  const generatedAt = createFoundationTimestamp();
  const proofreadManuscript = buildProofreadManuscript({
    projectId: parsed.projectId,
    editedAssetId: editedAsset.id,
    editedManuscript,
    styleProfile,
    chapterRevisions,
    generatedAt,
  });

  const proofreadVersion = await getNextProofreadVersion(parsed.projectId);
  const proofreadStoragePath = await uploadProofreadManuscript(
    parsed.projectId,
    proofreadVersion,
    proofreadManuscript
  );

  const { proofreadAssetId, transitioned } = await persistProofreadState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    editedAssetId: editedAsset.id,
    proofreadStoragePath,
    proofreadManuscript,
    proofreadVersion,
  });

  return {
    state: "proofread",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    editedAssetId: editedAsset.id,
    proofreadAssetId,
    proofreadAssetUri: proofreadStoragePath,
    chapterCount: proofreadManuscript.change_totals.chapter_count,
    correctionCount: proofreadManuscript.change_totals.correction_count,
    transitioned,
  };
}
