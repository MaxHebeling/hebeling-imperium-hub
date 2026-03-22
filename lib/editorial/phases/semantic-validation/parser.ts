import { createFoundationId } from "@/lib/editorial/foundation";
import type {
  EditorialSemanticIssue,
  EditorialValidationEntity,
} from "./types";

type ParsedSemanticValidationPayload = {
  summary: string;
  entity_registry: Array<{
    entity: string;
    kind: "person" | "location" | "date" | "term" | "organization" | "unknown";
    canonical_form: string;
    observed_forms: string[];
    chapter_ids: string[];
  }>;
  issues: Array<{
    category: "consistency" | "contradiction" | "entity" | "timeline";
    severity: "low" | "medium" | "high";
    title: string;
    explanation: string;
    chapter_ids: string[];
    auto_fixable: boolean;
    suggested_fix: string | null;
  }>;
  chapter_actions: Array<{
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

export function parseSemanticValidationPayload(rawText: string): {
  summary: string;
  entityRegistry: EditorialValidationEntity[];
  issues: EditorialSemanticIssue[];
  chapterActions: ParsedSemanticValidationPayload["chapter_actions"];
} {
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) {
    return {
      summary: "No se pudo obtener una validación estructurada; se conserva el texto proofread actual.",
      entityRegistry: [],
      issues: [],
      chapterActions: [],
    };
  }

  try {
    const parsed = JSON.parse(
      sanitizeJsonStringControls(extractedJson)
    ) as Partial<ParsedSemanticValidationPayload>;

    const entityRegistry: EditorialValidationEntity[] = Array.isArray(parsed.entity_registry)
      ? parsed.entity_registry
          .filter(
            (item): item is ParsedSemanticValidationPayload["entity_registry"][number] =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  typeof item.entity === "string" &&
                  typeof item.kind === "string" &&
                  typeof item.canonical_form === "string" &&
                  Array.isArray(item.observed_forms) &&
                  Array.isArray(item.chapter_ids)
              )
          )
          .map((item) => ({
            id: createFoundationId(),
            entity: item.entity,
            kind: item.kind,
            canonical_form: item.canonical_form,
            observed_forms: item.observed_forms.filter(
              (value): value is string => typeof value === "string"
            ),
            chapter_ids: item.chapter_ids.filter(
              (value): value is string => typeof value === "string"
            ),
          }))
      : [];

    const issues: EditorialSemanticIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues
          .filter(
            (item): item is ParsedSemanticValidationPayload["issues"][number] =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  typeof item.category === "string" &&
                  typeof item.severity === "string" &&
                  typeof item.title === "string" &&
                  typeof item.explanation === "string" &&
                  Array.isArray(item.chapter_ids) &&
                  typeof item.auto_fixable === "boolean"
              )
          )
          .map((item) => ({
            id: createFoundationId(),
            category: item.category,
            severity: item.severity,
            title: item.title,
            explanation: item.explanation,
            chapter_ids: item.chapter_ids.filter(
              (value): value is string => typeof value === "string"
            ),
            auto_fixable: item.auto_fixable,
            suggested_fix:
              typeof item.suggested_fix === "string" ? item.suggested_fix : null,
          }))
      : [];

    const chapterActions = Array.isArray(parsed.chapter_actions)
      ? parsed.chapter_actions
          .filter(
            (item): item is ParsedSemanticValidationPayload["chapter_actions"][number] =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  typeof item.chapter_id === "string" &&
                  typeof item.summary === "string" &&
                  Array.isArray(item.fixes)
              )
          )
          .map((item) => ({
            chapter_id: item.chapter_id,
            summary: item.summary,
            fixes: item.fixes.filter(
              (
                fix
              ): fix is ParsedSemanticValidationPayload["chapter_actions"][number]["fixes"][number] =>
                Boolean(
                  fix &&
                    typeof fix === "object" &&
                    typeof fix.category === "string" &&
                    typeof fix.title === "string" &&
                    typeof fix.rationale === "string" &&
                    typeof fix.original_excerpt === "string" &&
                    typeof fix.revised_excerpt === "string" &&
                    typeof fix.severity === "string"
                )
            ),
          }))
      : [];

    return {
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "Validación semántica completada.",
      entityRegistry,
      issues,
      chapterActions,
    };
  } catch {
    return {
      summary: "No se pudo parsear una validación estructurada; se conserva el texto proofread actual.",
      entityRegistry: [],
      issues: [],
      chapterActions: [],
    };
  }
}
