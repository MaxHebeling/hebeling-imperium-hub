import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialTrackedChange, EditorialChapterRevision } from "./types";

type ParsedChapterPayload = {
  summary: string;
  edited_text: string;
  structure_actions: string[];
  tone_alignment_notes: string[];
  preservation_notes: string[];
  tracked_changes: Array<{
    change_type: "structure" | "tone" | "clarity" | "language";
    title: string;
    rationale: string;
    before_excerpt: string;
    after_excerpt: string;
    impact: "low" | "medium" | "high";
  }>;
};

function extractFirstJsonObject(rawText: string): string | null {
  const fencedMatch =
    rawText.match(/```json\s*([\s\S]*?)```/i) ??
    rawText.match(/```\s*([\s\S]*?)```/);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = rawText.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(start, index + 1);
      }
    }
  }

  return null;
}

function sanitizeJsonStringControls(value: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
      if (char.charCodeAt(0) < 0x20) {
        result += " ";
        continue;
      }
    }

    result += char;
  }

  return result;
}

function safeParseChapterPayload(rawText: string): ParsedChapterPayload | null {
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) return null;

  try {
    const parsed = JSON.parse(sanitizeJsonStringControls(extractedJson)) as Partial<ParsedChapterPayload>;
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.edited_text !== "string" ||
      !Array.isArray(parsed.structure_actions) ||
      !Array.isArray(parsed.tone_alignment_notes) ||
      !Array.isArray(parsed.preservation_notes) ||
      !Array.isArray(parsed.tracked_changes)
    ) {
      return null;
    }

    return {
      summary: parsed.summary,
      edited_text: parsed.edited_text,
      structure_actions: parsed.structure_actions.filter((item): item is string => typeof item === "string"),
      tone_alignment_notes: parsed.tone_alignment_notes.filter((item): item is string => typeof item === "string"),
      preservation_notes: parsed.preservation_notes.filter((item): item is string => typeof item === "string"),
      tracked_changes: parsed.tracked_changes
        .filter((item): item is ParsedChapterPayload["tracked_changes"][number] => {
          return Boolean(
            item &&
              typeof item === "object" &&
              typeof item.change_type === "string" &&
              typeof item.title === "string" &&
              typeof item.rationale === "string" &&
              typeof item.before_excerpt === "string" &&
              typeof item.after_excerpt === "string" &&
              typeof item.impact === "string"
          );
        })
        .map((item) => ({
          change_type: item.change_type,
          title: item.title,
          rationale: item.rationale,
          before_excerpt: item.before_excerpt,
          after_excerpt: item.after_excerpt,
          impact: item.impact,
        })),
    };
  } catch {
    return null;
  }
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter(Boolean);
}

export function buildFallbackChapterRevision(input: {
  chapterId: string;
  chapterTitle: string;
  originalText: string;
  rawModelText: string;
}): EditorialChapterRevision {
  const originalWords = tokenize(input.originalText).length;
  const editedWords = tokenize(input.originalText).length;

  return {
    id: createFoundationId(),
    chapter_id: input.chapterId,
    chapter_title: input.chapterTitle,
    original_text: input.originalText,
    edited_text: input.originalText,
    summary:
      input.rawModelText.replace(/\s+/g, " ").trim().slice(0, 320) ||
      "No se pudo estructurar una edición segura; se conserva el texto original.",
    structure_actions: [],
    tone_alignment_notes: [],
    preservation_notes: [
      "Se mantuvo el contenido original para evitar alterar el significado sin una salida estructurada válida.",
    ],
    tracked_changes: [],
    metrics: {
      original_word_count: originalWords,
      edited_word_count: editedWords,
      change_ratio: 0,
    },
  };
}

export function parseChapterRevision(input: {
  chapterId: string;
  chapterTitle: string;
  originalText: string;
  rawModelText: string;
}): EditorialChapterRevision {
  const parsed = safeParseChapterPayload(input.rawModelText);
  if (!parsed) {
    return buildFallbackChapterRevision(input);
  }

  const originalWords = tokenize(input.originalText).length;
  const editedWords = tokenize(parsed.edited_text).length;
  const changeRatio =
    originalWords === 0
      ? 0
      : Math.min(1, Math.abs(editedWords - originalWords) / originalWords);

  const trackedChanges: EditorialTrackedChange[] = parsed.tracked_changes.map((change) => ({
    id: createFoundationId(),
    chapter_id: input.chapterId,
    change_type: change.change_type,
    title: change.title,
    rationale: change.rationale,
    before_excerpt: change.before_excerpt,
    after_excerpt: change.after_excerpt,
    impact: change.impact,
  }));

  return {
    id: createFoundationId(),
    chapter_id: input.chapterId,
    chapter_title: input.chapterTitle,
    original_text: input.originalText,
    edited_text: parsed.edited_text.trim() || input.originalText,
    summary: parsed.summary,
    structure_actions: parsed.structure_actions,
    tone_alignment_notes: parsed.tone_alignment_notes,
    preservation_notes: parsed.preservation_notes,
    tracked_changes: trackedChanges,
    metrics: {
      original_word_count: originalWords,
      edited_word_count: editedWords,
      change_ratio: Number(changeRatio.toFixed(4)),
    },
  };
}
