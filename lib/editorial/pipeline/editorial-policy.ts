import { getAdminClient } from "@/lib/leads/helpers";
import {
  REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID,
  resolveReinoEditorialTypographyPresetId,
} from "@/lib/editorial/kdp";
import type {
  EditorialInterventionLevel,
  EditorialPolicyAuditDirection,
  EditorialPolicyAuditSummary,
  EditorialPolicyAuditViolation,
  EditorialPolicyGuardStage,
} from "../types/editorial";

type JsonObject = Record<string, unknown>;

type EditorialPolicyMeta = {
  value: EditorialInterventionLevel;
  label: string;
  description: string;
  instructions: string[];
};

type EditorialPolicyGuardrail = {
  maxTotalDeltaRatio: number;
  maxItemDeltaRatio: number;
  minItemWordCount: number;
  minItemDeltaWords: number;
  maxParagraphDeltaRatio: number;
  minParagraphSimilarityRatio: number;
  minParagraphWordCount: number;
  exactParagraphCountRequired: boolean;
};

const HARD_RULES_VERSION = 2;

export const DEFAULT_EDITORIAL_INTERVENTION_LEVEL: EditorialInterventionLevel =
  "conservador";

export const EDITORIAL_INTERVENTION_LEVELS: readonly EditorialPolicyMeta[] = [
  {
    value: "conservador",
    label: "Conservador",
    description:
      "Corrige lo mínimo necesario. No reorganiza ni reescribe en profundidad.",
    instructions: [
      "Change as little as possible from the source text.",
      "Do not reorder paragraphs, scenes, or arguments.",
      "Do not condense, expand, or paraphrase beyond local clarity fixes.",
      "When in doubt, preserve the original wording.",
    ],
  },
  {
    value: "editorial",
    label: "Editorial",
    description:
      "Mejora claridad y fluidez, pero sin alterar fondo ni intención del autor.",
    instructions: [
      "You may improve flow, readability, and sentence quality.",
      "You may lightly reorder or tighten passages only when meaning is preserved exactly.",
      "Do not change scope, thesis, character intent, or narrative emphasis materially.",
      "Preserve the authorial voice as the primary reference.",
    ],
  },
  {
    value: "intervencion_alta",
    label: "Intervención alta",
    description:
      "Permite reescritura más fuerte y reorganización, pero sin inventar ni borrar contenido esencial.",
    instructions: [
      "You may perform stronger rewriting for clarity, rhythm, and readability.",
      "You may reorganize paragraphs or compress repetition when the full substance is preserved.",
      "Do not add new facts, scenes, arguments, or claims.",
      "Do not remove essential content, authorial intent, or distinctive voice markers.",
    ],
  },
] as const;

const EDITORIAL_POLICY_GUARDRAILS: Record<
  EditorialPolicyGuardStage,
  Record<EditorialInterventionLevel, EditorialPolicyGuardrail>
> = {
  content_editing: {
    conservador: {
      maxTotalDeltaRatio: 0.12,
      maxItemDeltaRatio: 0.18,
      minItemWordCount: 120,
      minItemDeltaWords: 35,
      maxParagraphDeltaRatio: 0.12,
      minParagraphSimilarityRatio: 0.82,
      minParagraphWordCount: 6,
      exactParagraphCountRequired: true,
    },
    editorial: {
      maxTotalDeltaRatio: 0.22,
      maxItemDeltaRatio: 0.3,
      minItemWordCount: 120,
      minItemDeltaWords: 45,
      maxParagraphDeltaRatio: 0.2,
      minParagraphSimilarityRatio: 0.72,
      minParagraphWordCount: 6,
      exactParagraphCountRequired: true,
    },
    intervencion_alta: {
      maxTotalDeltaRatio: 0.38,
      maxItemDeltaRatio: 0.5,
      minItemWordCount: 120,
      minItemDeltaWords: 60,
      maxParagraphDeltaRatio: 0.32,
      minParagraphSimilarityRatio: 0.6,
      minParagraphWordCount: 6,
      exactParagraphCountRequired: true,
    },
  },
  proofreading: {
    conservador: {
      maxTotalDeltaRatio: 0.06,
      maxItemDeltaRatio: 0.08,
      minItemWordCount: 120,
      minItemDeltaWords: 20,
      maxParagraphDeltaRatio: 0.06,
      minParagraphSimilarityRatio: 0.85,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
    editorial: {
      maxTotalDeltaRatio: 0.1,
      maxItemDeltaRatio: 0.14,
      minItemWordCount: 120,
      minItemDeltaWords: 25,
      maxParagraphDeltaRatio: 0.1,
      minParagraphSimilarityRatio: 0.88,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
    intervencion_alta: {
      maxTotalDeltaRatio: 0.18,
      maxItemDeltaRatio: 0.25,
      minItemWordCount: 120,
      minItemDeltaWords: 35,
      maxParagraphDeltaRatio: 0.16,
      minParagraphSimilarityRatio: 0.8,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
  },
  semantic_validation: {
    conservador: {
      maxTotalDeltaRatio: 0.03,
      maxItemDeltaRatio: 0.05,
      minItemWordCount: 120,
      minItemDeltaWords: 16,
      maxParagraphDeltaRatio: 0.03,
      minParagraphSimilarityRatio: 0.95,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
    editorial: {
      maxTotalDeltaRatio: 0.06,
      maxItemDeltaRatio: 0.1,
      minItemWordCount: 120,
      minItemDeltaWords: 20,
      maxParagraphDeltaRatio: 0.06,
      minParagraphSimilarityRatio: 0.9,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
    intervencion_alta: {
      maxTotalDeltaRatio: 0.1,
      maxItemDeltaRatio: 0.14,
      minItemWordCount: 120,
      minItemDeltaWords: 24,
      maxParagraphDeltaRatio: 0.1,
      minParagraphSimilarityRatio: 0.84,
      minParagraphWordCount: 4,
      exactParagraphCountRequired: true,
    },
  },
};

const POLICY_STAGE_LABELS: Record<EditorialPolicyGuardStage, string> = {
  content_editing: "edición de contenido",
  proofreading: "corrección lingüística",
  semantic_validation: "validación semántica",
};

function asObject(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

export function normalizeEditorialInterventionLevel(
  value: unknown
): EditorialInterventionLevel {
  if (
    value === "conservador" ||
    value === "editorial" ||
    value === "intervencion_alta"
  ) {
    return value;
  }

  return DEFAULT_EDITORIAL_INTERVENTION_LEVEL;
}

export function getEditorialInterventionLevelMeta(
  level: EditorialInterventionLevel
): EditorialPolicyMeta {
  return (
    EDITORIAL_INTERVENTION_LEVELS.find((item) => item.value === level) ??
    EDITORIAL_INTERVENTION_LEVELS[0]
  );
}

export function buildEditorialPolicySnapshot(
  level: EditorialInterventionLevel = DEFAULT_EDITORIAL_INTERVENTION_LEVEL
): JsonObject {
  return {
    intervention_level: level,
    hard_rules_version: HARD_RULES_VERSION,
    no_substantial_additions_or_deletions: true,
    no_invented_content: true,
    preserve_authorial_voice: true,
    preserve_facts_and_intent: true,
    strict_length_guard_enabled: true,
    paragraph_integrity_guard_enabled: true,
    exact_paragraph_preservation: true,
    no_paragraph_merges_or_splits: true,
  };
}

export function buildAmazonKdpConfigurationSnapshot(options?: {
  specialFormatEnabled?: boolean;
  trimSizeId?: string | null;
}): JsonObject {
  return {
    special_format_enabled: options?.specialFormatEnabled ?? false,
    trim_size_id: options?.trimSizeId ?? null,
  };
}

export function buildTypographyConfigurationSnapshot(options?: {
  bodyFontPresetId?: string | null;
}): JsonObject {
  return {
    body_font_preset_id: resolveReinoEditorialTypographyPresetId(
      options?.bodyFontPresetId ?? REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID
    ),
  };
}

export function extractEditorialInterventionLevelFromPipelineContext(
  pipelineContext: unknown
): EditorialInterventionLevel {
  const context = asObject(pipelineContext);
  const editorialPolicy = asObject(context.editorial_policy);
  return normalizeEditorialInterventionLevel(
    editorialPolicy.intervention_level
  );
}

export function extractSpecialKdpFormatEnabledFromPipelineContext(
  pipelineContext: unknown
): boolean {
  const context = asObject(pipelineContext);
  const amazonKdpConfiguration = asObject(context.amazon_kdp_configuration);
  return amazonKdpConfiguration.special_format_enabled === true;
}

export function extractTypographyPresetIdFromPipelineContext(
  pipelineContext: unknown
): string {
  const context = asObject(pipelineContext);
  const typographyConfiguration = asObject(context.typography_configuration);

  return resolveReinoEditorialTypographyPresetId(
    typeof typographyConfiguration.body_font_preset_id === "string"
      ? typographyConfiguration.body_font_preset_id
      : null
  );
}

export function mergeEditorialProjectPipelineContext(
  currentContext: unknown,
  patch: JsonObject
): JsonObject {
  const current = asObject(currentContext);
  const next: JsonObject = {
    ...current,
    ...patch,
  };

  if ("editorial_policy" in current || "editorial_policy" in patch) {
    next.editorial_policy = {
      ...asObject(current.editorial_policy),
      ...asObject(patch.editorial_policy),
    };
  }

  if ("amazon_kdp_configuration" in current || "amazon_kdp_configuration" in patch) {
    next.amazon_kdp_configuration = {
      ...asObject(current.amazon_kdp_configuration),
      ...asObject(patch.amazon_kdp_configuration),
    };
  }

  if ("typography_configuration" in current || "typography_configuration" in patch) {
    next.typography_configuration = {
      ...asObject(current.typography_configuration),
      ...asObject(patch.typography_configuration),
    };
  }

  return next;
}

export function buildDefaultEditorialProjectPipelineContext(
  level: EditorialInterventionLevel = DEFAULT_EDITORIAL_INTERVENTION_LEVEL
): JsonObject {
  return mergeEditorialProjectPipelineContext(
    {},
    {
      editorial_policy: buildEditorialPolicySnapshot(level),
      amazon_kdp_configuration: buildAmazonKdpConfigurationSnapshot(),
      typography_configuration: buildTypographyConfigurationSnapshot(),
    }
  );
}

export async function getEditorialProjectPipelineContext(
  projectId: string
): Promise<JsonObject> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select("pipeline_context")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return buildDefaultEditorialProjectPipelineContext();
  }

  return mergeEditorialProjectPipelineContext(data.pipeline_context, {
    editorial_policy: buildEditorialPolicySnapshot(
      extractEditorialInterventionLevelFromPipelineContext(data.pipeline_context)
    ),
    amazon_kdp_configuration: buildAmazonKdpConfigurationSnapshot({
      specialFormatEnabled:
        extractSpecialKdpFormatEnabledFromPipelineContext(data.pipeline_context),
      trimSizeId:
        asObject(asObject(data.pipeline_context).amazon_kdp_configuration)
          .trim_size_id as string | null | undefined,
    }),
    typography_configuration: buildTypographyConfigurationSnapshot({
      bodyFontPresetId: extractTypographyPresetIdFromPipelineContext(
        data.pipeline_context
      ),
    }),
  });
}

export async function buildMergedEditorialProjectPipelineContext(
  projectId: string,
  patch: JsonObject
): Promise<JsonObject> {
  const current = await getEditorialProjectPipelineContext(projectId);
  return mergeEditorialProjectPipelineContext(current, patch);
}

export async function getEditorialInterventionLevelForProject(
  projectId: string
): Promise<EditorialInterventionLevel> {
  const context = await getEditorialProjectPipelineContext(projectId);
  return extractEditorialInterventionLevelFromPipelineContext(context);
}

function tokenizeWords(text: string): string[] {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}+/gu, "")
      .match(/\p{L}+/gu) ?? []
  ).filter(Boolean);
}

function toRoundedRatio(value: number): number {
  return Number(value.toFixed(4));
}

function getGuardrail(
  stage: EditorialPolicyGuardStage,
  level: EditorialInterventionLevel
): EditorialPolicyGuardrail {
  return EDITORIAL_POLICY_GUARDRAILS[stage][level];
}

function getAuditDirection(deltaWords: number): EditorialPolicyAuditDirection {
  if (deltaWords > 0) {
    return "expansion";
  }
  if (deltaWords < 0) {
    return "reduction";
  }
  return "stable";
}

function buildAuditViolation(input: {
  kind: EditorialPolicyAuditViolation["kind"];
  label: string;
  originalWordCount: number;
  revisedWordCount: number;
  paragraphIndex?: number | null;
  similarityRatio?: number | null;
  originalParagraphCount?: number | null;
  revisedParagraphCount?: number | null;
}): EditorialPolicyAuditViolation {
  const deltaWords = input.revisedWordCount - input.originalWordCount;
  const deltaRatio =
    input.originalWordCount === 0
      ? 0
      : Math.abs(deltaWords) / input.originalWordCount;

  return {
    label: input.label,
    kind: input.kind,
    direction: getAuditDirection(deltaWords),
    delta_words: deltaWords,
    delta_ratio: toRoundedRatio(deltaRatio),
    original_word_count: input.originalWordCount,
    revised_word_count: input.revisedWordCount,
    paragraph_index: input.paragraphIndex ?? null,
    similarity_ratio:
      typeof input.similarityRatio === "number"
        ? toRoundedRatio(input.similarityRatio)
        : null,
    original_paragraph_count: input.originalParagraphCount ?? null,
    revised_paragraph_count: input.revisedParagraphCount ?? null,
  };
}

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function computeParagraphSimilarity(originalText: string, revisedText: string): number {
  const originalWords = Array.from(new Set(tokenizeWords(originalText)));
  const revisedWords = Array.from(new Set(tokenizeWords(revisedText)));

  if (originalWords.length === 0 && revisedWords.length === 0) {
    return 1;
  }

  if (originalWords.length === 0 || revisedWords.length === 0) {
    return 0;
  }

  const revisedWordSet = new Set(revisedWords);
  let intersectionCount = 0;

  for (const word of originalWords) {
    if (revisedWordSet.has(word)) {
      intersectionCount += 1;
    }
  }

  return (2 * intersectionCount) / (originalWords.length + revisedWords.length);
}

export function buildEditorialPolicyAudit(options: {
  stage: EditorialPolicyGuardStage;
  level: EditorialInterventionLevel;
  items: Array<{
    label: string;
    originalText: string;
    revisedText: string;
  }>;
}): EditorialPolicyAuditSummary {
  const thresholds = getGuardrail(options.stage, options.level);
  const violations: EditorialPolicyAuditViolation[] = [];

  let totalOriginalWordCount = 0;
  let totalRevisedWordCount = 0;
  let totalOriginalParagraphCount = 0;
  let totalRevisedParagraphCount = 0;
  let checkedItemCount = 0;
  let paragraphViolationCount = 0;

  for (const item of options.items) {
    const originalWordCount = tokenizeWords(item.originalText).length;
    const revisedWordCount = tokenizeWords(item.revisedText).length;
    const deltaWords = revisedWordCount - originalWordCount;
    const deltaRatio =
      originalWordCount === 0
        ? 0
        : Math.abs(deltaWords) / originalWordCount;

    totalOriginalWordCount += originalWordCount;
    totalRevisedWordCount += revisedWordCount;

    const originalParagraphs = splitParagraphs(item.originalText);
    const revisedParagraphs = splitParagraphs(item.revisedText);
    totalOriginalParagraphCount += originalParagraphs.length;
    totalRevisedParagraphCount += revisedParagraphs.length;

    if (
      thresholds.exactParagraphCountRequired &&
      originalParagraphs.length !== revisedParagraphs.length
    ) {
      paragraphViolationCount += 1;
      violations.push(
        buildAuditViolation({
          kind: "paragraph_count_mismatch",
          label: item.label,
          originalWordCount,
          revisedWordCount,
          originalParagraphCount: originalParagraphs.length,
          revisedParagraphCount: revisedParagraphs.length,
        })
      );
      continue;
    }

    const comparedParagraphCount = Math.min(
      originalParagraphs.length,
      revisedParagraphs.length
    );

    for (let paragraphIndex = 0; paragraphIndex < comparedParagraphCount; paragraphIndex += 1) {
      const originalParagraph = originalParagraphs[paragraphIndex] ?? "";
      const revisedParagraph = revisedParagraphs[paragraphIndex] ?? "";
      const originalParagraphWordCount = tokenizeWords(originalParagraph).length;
      const revisedParagraphWordCount = tokenizeWords(revisedParagraph).length;

      if (
        originalParagraphWordCount < thresholds.minParagraphWordCount &&
        revisedParagraphWordCount < thresholds.minParagraphWordCount
      ) {
        continue;
      }

      const paragraphDeltaRatio =
        originalParagraphWordCount === 0
          ? revisedParagraphWordCount === 0
            ? 0
            : 1
          : Math.abs(revisedParagraphWordCount - originalParagraphWordCount) /
            originalParagraphWordCount;
      const paragraphSimilarity = computeParagraphSimilarity(
        originalParagraph,
        revisedParagraph
      );
      const paragraphLabel = `${item.label} · párrafo ${paragraphIndex + 1}`;

      if (paragraphDeltaRatio > thresholds.maxParagraphDeltaRatio) {
        paragraphViolationCount += 1;
        violations.push(
          buildAuditViolation({
            kind: "paragraph_delta_guard",
            label: paragraphLabel,
            originalWordCount: originalParagraphWordCount,
            revisedWordCount: revisedParagraphWordCount,
            paragraphIndex: paragraphIndex + 1,
            similarityRatio: paragraphSimilarity,
          })
        );
      }

      if (paragraphSimilarity < thresholds.minParagraphSimilarityRatio) {
        paragraphViolationCount += 1;
        violations.push(
          buildAuditViolation({
            kind: "paragraph_similarity_guard",
            label: paragraphLabel,
            originalWordCount: originalParagraphWordCount,
            revisedWordCount: revisedParagraphWordCount,
            paragraphIndex: paragraphIndex + 1,
            similarityRatio: paragraphSimilarity,
          })
        );
      }
    }

    const shouldCheckItem =
      originalWordCount >= thresholds.minItemWordCount ||
      Math.abs(deltaWords) >= thresholds.minItemDeltaWords;

    if (!shouldCheckItem) {
      continue;
    }

    checkedItemCount += 1;

    if (deltaRatio > thresholds.maxItemDeltaRatio) {
      violations.push(
        buildAuditViolation({
          kind: "item_delta_guard",
          label: item.label,
          originalWordCount,
          revisedWordCount,
        })
      );
    }
  }

  const totalDeltaWords = totalRevisedWordCount - totalOriginalWordCount;
  const totalDeltaRatio =
    totalOriginalWordCount === 0
      ? 0
      : Math.abs(totalDeltaWords) / totalOriginalWordCount;

  if (totalOriginalWordCount > 0 && totalDeltaRatio > thresholds.maxTotalDeltaRatio) {
    violations.unshift(
      buildAuditViolation({
        kind: "total_delta_guard",
        label: "Manuscrito completo",
        originalWordCount: totalOriginalWordCount,
        revisedWordCount: totalRevisedWordCount,
      })
    );
  }

  return {
    stage: options.stage,
    level: options.level,
    total_original_word_count: totalOriginalWordCount,
    total_revised_word_count: totalRevisedWordCount,
    total_delta_words: totalDeltaWords,
    total_delta_ratio: toRoundedRatio(totalDeltaRatio),
    max_total_delta_ratio: thresholds.maxTotalDeltaRatio,
    max_item_delta_ratio: thresholds.maxItemDeltaRatio,
    min_item_word_count: thresholds.minItemWordCount,
    min_item_delta_words: thresholds.minItemDeltaWords,
    paragraph_guard_enabled: true,
    total_original_paragraph_count: totalOriginalParagraphCount,
    total_revised_paragraph_count: totalRevisedParagraphCount,
    max_paragraph_delta_ratio: thresholds.maxParagraphDeltaRatio,
    min_paragraph_similarity_ratio: thresholds.minParagraphSimilarityRatio,
    min_paragraph_word_count: thresholds.minParagraphWordCount,
    paragraph_violation_count: paragraphViolationCount,
    checked_item_count: checkedItemCount,
    violation_count: violations.length,
    violations,
  };
}

export function buildEditorialPolicyAuditErrorMessage(
  audit: EditorialPolicyAuditSummary
): string {
  const relevantViolations = audit.violations
    .slice(0, 3)
    .map((violation) => {
      if (violation.kind === "paragraph_count_mismatch") {
        return `${violation.label}: el número de párrafos cambió de ${
          violation.original_paragraph_count ?? 0
        } a ${violation.revised_paragraph_count ?? 0}`;
      }

      if (violation.kind === "paragraph_similarity_guard") {
        return `${violation.label}: la similitud con el párrafo original cayó a ${formatPercent(
          violation.similarity_ratio ?? 0
        )}`;
      }

      const directionLabel =
        violation.direction === "expansion"
          ? "expansión"
          : violation.direction === "reduction"
            ? "reducción"
            : "variación";

      return `${violation.label}: ${directionLabel} de ${formatPercent(
        violation.delta_ratio
      )} (${Math.abs(violation.delta_words)} palabras)`;
    })
    .join("; ");

  return [
    `El nivel editorial ${getEditorialInterventionLevelMeta(audit.level).label} bloqueó la fase de ${POLICY_STAGE_LABELS[audit.stage]}.`,
    `El texto cambió más de lo permitido o rompió la integridad de párrafos (límite global ${formatPercent(audit.max_total_delta_ratio)}, por bloque ${formatPercent(audit.max_item_delta_ratio)}, por párrafo ${formatPercent(audit.max_paragraph_delta_ratio)}).`,
    relevantViolations || "No se pudo validar una comparación segura del texto.",
  ].join(" ");
}

export function assertEditorialPolicyAudit(options: {
  stage: EditorialPolicyGuardStage;
  level: EditorialInterventionLevel;
  items: Array<{
    label: string;
    originalText: string;
    revisedText: string;
  }>;
}): EditorialPolicyAuditSummary {
  const audit = buildEditorialPolicyAudit(options);

  if (audit.violation_count > 0) {
    throw new Error(buildEditorialPolicyAuditErrorMessage(audit));
  }

  return audit;
}

export function buildEditorialPolicyPromptSection(options: {
  stage:
    | "content_editing"
    | "proofreading"
    | "semantic_validation";
  level: EditorialInterventionLevel;
}): string {
  const meta = getEditorialInterventionLevelMeta(options.level);

  const baseRules = [
    "Never add new scenes, claims, facts, examples, names, chronology, or arguments that are not already present in the source text.",
    "Never remove substantive content, authorial points, scenes, or arguments unless the source has an exact duplicate or an obviously broken fragment.",
    "Preserve authorial intent, factual meaning, narrative logic, and distinctive voice.",
    "Work as a professional publishing-house editor: deliver a text that is publication-ready in grammar, orthography, punctuation, and consistency.",
    "Correct objective language problems exhaustively when they can be fixed without altering meaning.",
    "Prefer professional editorial polish over mechanical pass-through, but never at the cost of changing what the author is saying.",
    "Preserve the exact paragraph order from the source text.",
    "Keep a 1:1 paragraph mapping between source and output. Do not merge, split, delete, or insert paragraphs.",
    "If a paragraph does not require an obvious correction, keep it exactly as written.",
    "If a requested change would require inventing or deleting substantial content, keep the original substance and report the issue instead.",
    "The system will reject outputs that expand or reduce the text beyond the allowed guardrails for this intervention level and stage.",
    "The system will reject outputs whose paragraph count changes or whose paragraph similarity falls below the required threshold.",
  ];

  const stageRules =
    options.stage === "content_editing"
      ? [
          "Treat this stage as conservative textual refinement, not as a rewrite.",
          "Do not reorder, condense, expand, paraphrase, or restructure paragraphs.",
          "Only apply obvious local fixes that the author would recognize as the same text.",
        ]
      : options.stage === "proofreading"
        ? [
            "Limit edits to language, mechanics, and consistency.",
            "Do not perform developmental rewrites during proofreading.",
          ]
        : [
            "Apply only exact, low-risk semantic fixes that are fully supported by the provided context.",
            "If a fix requires interpretation beyond the source context, do not auto-fix it.",
            "Do not alter paragraph structure while applying semantic fixes.",
          ];

  return [
    `Editorial intervention level: ${meta.label}.`,
    `Level description: ${meta.description}`,
    "Non-negotiable editorial rules:",
    ...baseRules.map((rule) => `- ${rule}`),
    "Level-specific instructions:",
    ...meta.instructions.map((rule) => `- ${rule}`),
    "Stage-specific instructions:",
    ...stageRules.map((rule) => `- ${rule}`),
  ].join("\n");
}
