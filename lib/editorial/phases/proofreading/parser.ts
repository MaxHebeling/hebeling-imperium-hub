import { createFoundationId } from "@/lib/editorial/foundation";
import type {
  EditorialProofreadChapter,
  EditorialProofreadChange,
} from "./types";

type ParsedProofreadingPayload = {
  summary: string;
  proofread_text: string;
  applied_rules: string[];
  editorial_flags: string[];
  changes: Array<{
    category: "grammar" | "spelling" | "punctuation" | "style" | "consistency";
    title: string;
    rationale: string;
    before_excerpt: string;
    after_excerpt: string;
    severity: "low" | "medium" | "high";
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

function safeParseProofreadingPayload(
  rawText: string
): ParsedProofreadingPayload | null {
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) return null;

  try {
    const parsed = JSON.parse(
      sanitizeJsonStringControls(extractedJson)
    ) as Partial<ParsedProofreadingPayload>;

    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.proofread_text !== "string" ||
      !Array.isArray(parsed.applied_rules) ||
      !Array.isArray(parsed.editorial_flags) ||
      !Array.isArray(parsed.changes)
    ) {
      return null;
    }

    return {
      summary: parsed.summary,
      proofread_text: parsed.proofread_text,
      applied_rules: parsed.applied_rules.filter(
        (item): item is string => typeof item === "string"
      ),
      editorial_flags: parsed.editorial_flags.filter(
        (item): item is string => typeof item === "string"
      ),
      changes: parsed.changes
        .filter(
          (item): item is ParsedProofreadingPayload["changes"][number] =>
            Boolean(
              item &&
                typeof item === "object" &&
                typeof item.category === "string" &&
                typeof item.title === "string" &&
                typeof item.rationale === "string" &&
                typeof item.before_excerpt === "string" &&
                typeof item.after_excerpt === "string" &&
                typeof item.severity === "string"
            )
        )
        .map((item) => ({
          category: item.category,
          title: item.title,
          rationale: item.rationale,
          before_excerpt: item.before_excerpt,
          after_excerpt: item.after_excerpt,
          severity: item.severity,
        })),
    };
  } catch {
    return null;
  }
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter(Boolean);
}

export function buildFallbackProofreadChapter(input: {
  chapterId: string;
  chapterTitle: string;
  editedText: string;
  rawModelText: string;
}): EditorialProofreadChapter {
  const editedWords = tokenize(input.editedText).length;

  return {
    id: createFoundationId(),
    chapter_id: input.chapterId,
    chapter_title: input.chapterTitle,
    original_text: input.editedText,
    proofread_text: input.editedText,
    summary:
      input.rawModelText.replace(/\s+/g, " ").trim().slice(0, 320) ||
      "No se pudo estructurar una corrección segura; se conserva el texto editado.",
    applied_rules: [],
    editorial_flags: [
      "Se conservó el texto editado porque la salida no fue estructurada de forma válida.",
    ],
    changes: [],
    metrics: {
      original_word_count: editedWords,
      proofread_word_count: editedWords,
      change_ratio: 0,
    },
  };
}

export function parseProofreadChapter(input: {
  chapterId: string;
  chapterTitle: string;
  editedText: string;
  rawModelText: string;
}): EditorialProofreadChapter {
  const parsed = safeParseProofreadingPayload(input.rawModelText);
  if (!parsed) {
    return buildFallbackProofreadChapter(input);
  }

  const originalWords = tokenize(input.editedText).length;
  const proofreadWords = tokenize(parsed.proofread_text).length;
  const changeRatio =
    originalWords === 0
      ? 0
      : Math.min(1, Math.abs(proofreadWords - originalWords) / originalWords);

  const changes: EditorialProofreadChange[] = parsed.changes.map((change) => ({
    id: createFoundationId(),
    chapter_id: input.chapterId,
    category: change.category,
    title: change.title,
    rationale: change.rationale,
    before_excerpt: change.before_excerpt,
    after_excerpt: change.after_excerpt,
    severity: change.severity,
  }));

  return {
    id: createFoundationId(),
    chapter_id: input.chapterId,
    chapter_title: input.chapterTitle,
    original_text: input.editedText,
    proofread_text: parsed.proofread_text.trim() || input.editedText,
    summary: parsed.summary,
    applied_rules: parsed.applied_rules,
    editorial_flags: parsed.editorial_flags,
    changes,
    metrics: {
      original_word_count: originalWords,
      proofread_word_count: proofreadWords,
      change_ratio: Number(changeRatio.toFixed(4)),
    },
  };
}
