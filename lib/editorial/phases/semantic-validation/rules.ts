import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialProofreadManuscript } from "../proofreading/types";
import type {
  EditorialValidationEntity,
  EditorialValidationEntityKind,
  EditorialValidationFix,
  EditorialValidatedChapter,
} from "./types";

type ProofreadChapterInput = EditorialProofreadManuscript["chapter_revisions"][number];

type ValidationAction = {
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
};

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter(Boolean);
}

function inferEntityKind(value: string): EditorialValidationEntityKind {
  if (/\b\d{4}\b/.test(value) || /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(value)) {
    return "date";
  }
  if (/\b(S\.A\.|Inc\.|Corp\.|Editorial|University|Ministerio)\b/i.test(value)) {
    return "organization";
  }
  if (/\b(ciudad|calle|avenida|reino|bosque|mar|montaña)\b/i.test(value)) {
    return "location";
  }
  if (value.split(/\s+/).length >= 2) {
    return "person";
  }
  return "term";
}

function extractCapitalizedEntities(text: string): string[] {
  return text.match(/\b(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b/g) ?? [];
}

function extractDateLikeEntities(text: string): string[] {
  return (
    text.match(
      /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi
    ) ?? []
  );
}

export function buildEntityRegistry(
  chapters: ProofreadChapterInput[]
): EditorialValidationEntity[] {
  const registry = new Map<
    string,
    {
      canonical_form: string;
      observed_forms: Set<string>;
      chapter_ids: Set<string>;
      kind: EditorialValidationEntityKind;
    }
  >();

  for (const chapter of chapters) {
    const values = [
      ...extractCapitalizedEntities(chapter.proofread_text),
      ...extractDateLikeEntities(chapter.proofread_text),
    ];

    for (const rawValue of values) {
      const value = rawValue.trim();
      if (value.length < 3) continue;

      const key = value.toLowerCase();
      const current = registry.get(key);

      if (current) {
        current.observed_forms.add(value);
        current.chapter_ids.add(chapter.chapter_id);
        continue;
      }

      registry.set(key, {
        canonical_form: value,
        observed_forms: new Set([value]),
        chapter_ids: new Set([chapter.chapter_id]),
        kind: inferEntityKind(value),
      });
    }
  }

  return Array.from(registry.entries())
    .filter(([, value]) => value.observed_forms.size > 0)
    .map(([entity, value]) => ({
      id: createFoundationId(),
      entity,
      kind: value.kind,
      canonical_form: value.canonical_form,
      observed_forms: Array.from(value.observed_forms).sort(),
      chapter_ids: Array.from(value.chapter_ids),
    }))
    .sort((left, right) => left.canonical_form.localeCompare(right.canonical_form));
}

function replaceFirstExact(haystack: string, needle: string, replacement: string) {
  const index = haystack.indexOf(needle);
  if (index === -1) {
    return { text: haystack, applied: false };
  }

  return {
    text: `${haystack.slice(0, index)}${replacement}${haystack.slice(index + needle.length)}`,
    applied: true,
  };
}

export function applyValidationActions(input: {
  chapters: ProofreadChapterInput[];
  actions: ValidationAction[];
}): EditorialValidatedChapter[] {
  return input.chapters.map((chapter) => {
    const action = input.actions.find((item) => item.chapter_id === chapter.chapter_id);
    let validatedText = chapter.proofread_text;

    const appliedFixes: EditorialValidationFix[] = [];
    const skippedFixes: EditorialValidationFix[] = [];

    for (const fix of action?.fixes ?? []) {
      const candidate: EditorialValidationFix = {
        id: createFoundationId(),
        category: fix.category,
        title: fix.title,
        rationale: fix.rationale,
        original_excerpt: fix.original_excerpt,
        revised_excerpt: fix.revised_excerpt,
        severity: fix.severity,
        applied: false,
      };

      if (!fix.original_excerpt || !fix.revised_excerpt) {
        skippedFixes.push(candidate);
        continue;
      }

      const replaced = replaceFirstExact(
        validatedText,
        fix.original_excerpt,
        fix.revised_excerpt
      );

      if (!replaced.applied) {
        skippedFixes.push(candidate);
        continue;
      }

      validatedText = replaced.text;
      appliedFixes.push({ ...candidate, applied: true });
    }

    const originalWords = tokenize(chapter.proofread_text).length;
    const validatedWords = tokenize(validatedText).length;
    const changeRatio =
      originalWords === 0
        ? 0
        : Math.min(1, Math.abs(validatedWords - originalWords) / originalWords);

    return {
      id: createFoundationId(),
      chapter_id: chapter.chapter_id,
      chapter_title: chapter.chapter_title,
      original_text: chapter.proofread_text,
      validated_text: validatedText,
      summary: action?.summary ?? "Validación semántica completada sin ajustes estructurados.",
      applied_fixes: appliedFixes,
      skipped_fixes: skippedFixes,
      metrics: {
        original_word_count: originalWords,
        validated_word_count: validatedWords,
        change_ratio: Number(changeRatio.toFixed(4)),
      },
    };
  });
}
