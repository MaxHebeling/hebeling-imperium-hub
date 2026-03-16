/**
 * LanguageTool API Integration — Professional Grammar & Orthotypography Correction
 *
 * LanguageTool is an open-source grammar, style, and spell checker that supports
 * 30+ languages including Spanish and English. It provides detailed correction
 * suggestions with context, rule explanations, and replacement options.
 *
 * API Docs: https://languagetool.org/http-api/
 *
 * Configuration:
 * - LANGUAGETOOL_API_KEY: API key from https://languagetool.org/editor/settings/access-tokens
 * - LANGUAGETOOL_API_URL: (optional) defaults to https://api.languagetoolplus.com/v2
 *
 * Free tier: 20 requests/minute, 10,000 chars/request
 * Premium: higher limits, additional rules, style suggestions
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  context: {
    text: string;
    offset: number;
    length: number;
  };
  sentence: string;
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface LanguageToolResponse {
  software: { name: string; version: string; apiVersion: number };
  language: { name: string; code: string; detectedLanguage?: { name: string; code: string; confidence: number } };
  matches: LanguageToolMatch[];
}

export interface LanguageToolCorrectionResult {
  /** Total matches/issues found */
  totalIssues: number;
  /** Issues grouped by category */
  byCategory: Record<string, number>;
  /** Issues grouped by type (grammar, spelling, style, typographical, etc.) */
  byType: Record<string, number>;
  /** Detected language */
  detectedLanguage: string;
  /** Detailed corrections */
  corrections: LanguageToolCorrection[];
  /** Processing time in ms */
  processingTimeMs: number;
}

export interface LanguageToolCorrection {
  /** Original text fragment with error */
  original: string;
  /** Suggested replacement(s) */
  suggestions: string[];
  /** Explanation of the error */
  message: string;
  /** Short description */
  shortMessage: string;
  /** Category (grammar, spelling, style, etc.) */
  category: string;
  /** Rule that triggered this correction */
  ruleId: string;
  /** Issue type (misspelling, grammar, typographical, style, etc.) */
  issueType: string;
  /** Context: the sentence where the error was found */
  sentence: string;
  /** Character offset in the original text */
  offset: number;
  /** Length of the error fragment */
  length: number;
}

// ─── Configuration ──────────────────────────────────────────────────

const LANGUAGETOOL_API_URL =
  process.env.LANGUAGETOOL_API_URL || "https://api.languagetoolplus.com/v2";

function getApiKey(): string | null {
  return process.env.LANGUAGETOOL_API_KEY || null;
}

/**
 * Check if LanguageTool is available (API key configured)
 */
export function isLanguageToolAvailable(): boolean {
  return !!getApiKey();
}

// ─── Core API Call ──────────────────────────────────────────────────

/**
 * Send text to LanguageTool API for checking.
 * Splits long texts into chunks of 10,000 chars to respect API limits.
 */
async function checkText(
  text: string,
  language: "es" | "en-US" | "auto"
): Promise<LanguageToolResponse> {
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  const params = new URLSearchParams({
    text,
    language,
    enabledOnly: "false",
  });

  // Add API key if available (premium features)
  if (apiKey) {
    params.set("apiKey", apiKey);
    // Enable premium-only rules
    params.set("level", "picky");
  }

  const response = await fetch(`${LANGUAGETOOL_API_URL}/check`, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LanguageTool API error (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as LanguageToolResponse;
}

// ─── Main Correction Function ───────────────────────────────────────

/**
 * Run professional grammar and orthotypography correction using LanguageTool.
 *
 * @param text - The manuscript text to check
 * @param language - "es" for Spanish, "en-US" for American English, "auto" for auto-detect
 * @returns Detailed correction results
 */
export async function runLanguageToolCorrection(
  text: string,
  language: "es" | "en-US" | "auto" = "auto"
): Promise<LanguageToolCorrectionResult> {
  const startTime = Date.now();

  // LanguageTool has a 10,000 char limit per request on free tier.
  // For premium, it's higher but we chunk anyway for safety.
  const CHUNK_SIZE = 10000;
  const allMatches: LanguageToolMatch[] = [];
  let detectedLang = language;

  // Split text into chunks, respecting sentence boundaries where possible
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }
    // Try to split at the last sentence boundary within the chunk
    const chunk = remaining.slice(0, CHUNK_SIZE);
    const lastPeriod = chunk.lastIndexOf(". ");
    const lastNewline = chunk.lastIndexOf("\n");
    const splitAt = Math.max(lastPeriod, lastNewline);
    if (splitAt > CHUNK_SIZE * 0.5) {
      chunks.push(remaining.slice(0, splitAt + 1));
      remaining = remaining.slice(splitAt + 1);
    } else {
      chunks.push(chunk);
      remaining = remaining.slice(CHUNK_SIZE);
    }
  }

  // Process chunks sequentially (respect rate limits)
  let globalOffset = 0;
  for (const chunk of chunks) {
    const result = await checkText(chunk, language);

    // Capture detected language from first chunk
    if (detectedLang === "auto" && result.language.detectedLanguage) {
      detectedLang = result.language.detectedLanguage.code;
    }

    // Adjust offsets for chunked processing
    for (const match of result.matches) {
      allMatches.push({
        ...match,
        offset: match.offset + globalOffset,
      });
    }

    globalOffset += chunk.length;

    // Small delay between chunks to respect rate limits
    if (chunks.length > 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Build categorized results
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const corrections: LanguageToolCorrection[] = [];

  for (const match of allMatches) {
    const category = match.rule.category.name;
    const issueType = match.rule.issueType;

    byCategory[category] = (byCategory[category] || 0) + 1;
    byType[issueType] = (byType[issueType] || 0) + 1;

    corrections.push({
      original: text.slice(match.offset, match.offset + match.length),
      suggestions: match.replacements.slice(0, 5).map((r) => r.value),
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      category,
      ruleId: match.rule.id,
      issueType,
      sentence: match.sentence,
      offset: match.offset,
      length: match.length,
    });
  }

  return {
    totalIssues: allMatches.length,
    byCategory,
    byType,
    detectedLanguage: detectedLang,
    corrections,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Apply LanguageTool corrections to text automatically.
 * Only applies corrections with high confidence (single clear replacement).
 * Returns the corrected text and a list of applied changes.
 */
export function applyAutoCorrections(
  text: string,
  corrections: LanguageToolCorrection[],
  options: { onlyHighConfidence?: boolean } = {}
): { correctedText: string; appliedCount: number; skippedCount: number } {
  const { onlyHighConfidence = true } = options;

  // Sort corrections by offset descending (apply from end to start to preserve offsets)
  const sorted = [...corrections].sort((a, b) => b.offset - a.offset);

  let result = text;
  let appliedCount = 0;
  let skippedCount = 0;

  for (const correction of sorted) {
    // Only auto-apply if there's exactly one clear suggestion
    if (onlyHighConfidence && correction.suggestions.length !== 1) {
      skippedCount++;
      continue;
    }

    // Skip style suggestions (those are subjective)
    if (onlyHighConfidence && correction.issueType === "style") {
      skippedCount++;
      continue;
    }

    const replacement = correction.suggestions[0];
    if (!replacement) {
      skippedCount++;
      continue;
    }

    // Apply the correction
    result =
      result.slice(0, correction.offset) +
      replacement +
      result.slice(correction.offset + correction.length);
    appliedCount++;
  }

  return { correctedText: result, appliedCount, skippedCount };
}
