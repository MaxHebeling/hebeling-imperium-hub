import type { AiTextSuggestion } from "./suggestions-types";

export interface LineEditingResult {
  summary: string;
  total_changes: number;
  changes: Array<
    Pick<
      AiTextSuggestion,
      | "id"
      | "kind"
      | "severity"
      | "confidence"
      | "location"
      | "original_text"
      | "suggested_text"
      | "justification"
    >
  >;
}

export interface CopyeditingResult {
  summary: string;
  total_changes: number;
  changes: Array<
    Pick<
      AiTextSuggestion,
      | "id"
      | "kind"
      | "severity"
      | "confidence"
      | "location"
      | "original_text"
      | "suggested_text"
      | "justification"
    >
  >;
}

export interface ConceptIssue {
  id: string;
  type: "doctrina" | "teologia" | "concepto" | "tono";
  severity: "baja" | "media" | "alta";
  location: string | null;
  description: string;
  reference?: string | null;
  suggested_review?: string | null;
  confidence: number;
}

export interface ConceptReviewResult {
  summary: string;
  issues: ConceptIssue[];
  theological_profile?: {
    alignment: "coherente" | "mayormente_coherente" | "problematico";
    sensitive_topics?: string[];
  } | null;
}

