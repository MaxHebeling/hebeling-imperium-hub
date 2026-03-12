import type { AiTextLocation } from "@/lib/editorial/ai/suggestions-types";

export interface SuggestionToApply {
  id: string;
  location: AiTextLocation;
  original_text: string;
  suggested_text: string;
}

/**
 * Aplica sugerencias a un texto plano por offset_start/offset_end.
 * Se aplican de atrás hacia adelante para no desalinear offsets.
 * Sugerencias sin offsets numéricos se ignoran.
 */
export function applySuggestionsToText(
  plainText: string,
  suggestions: SuggestionToApply[]
): string {
  const withOffsets = suggestions.filter(
    (s) =>
      typeof s.location.offset_start === "number" &&
      typeof s.location.offset_end === "number"
  );

  const sorted = [...withOffsets].sort(
    (a, b) => (b.location.offset_start ?? 0) - (a.location.offset_start ?? 0)
  );

  let result = plainText;
  for (const s of sorted) {
    const start = s.location.offset_start as number;
    const end = s.location.offset_end as number;
    result = result.slice(0, start) + s.suggested_text + result.slice(end);
  }
  return result;
}
