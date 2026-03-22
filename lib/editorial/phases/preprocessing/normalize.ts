import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import type {
  DetectedLanguage,
  NormalizedManuscriptBlock,
  NormalizedManuscriptChapter,
  NormalizedManuscriptDocument,
  NormalizedManuscriptStats,
} from "./types";

const SPANISH_STOPWORDS = new Set([
  "de",
  "la",
  "que",
  "el",
  "en",
  "y",
  "a",
  "los",
  "del",
  "se",
  "las",
  "por",
  "un",
  "para",
  "con",
  "no",
  "una",
  "su",
  "al",
  "lo",
]);

const ENGLISH_STOPWORDS = new Set([
  "the",
  "and",
  "of",
  "to",
  "in",
  "a",
  "is",
  "that",
  "for",
  "it",
  "as",
  "with",
  "was",
  "on",
  "be",
  "by",
  "this",
  "are",
  "or",
  "from",
]);

function normalizeLine(line: string): string {
  return line.replace(/\u00A0/g, " ").replace(/\t/g, " ").trim();
}

function looksLikeChapterHeading(text: string): boolean {
  const normalized = text.trim();
  return /^(cap[ií]tulo|chapter)\s+[\w\divxlcdm.-]+/i.test(normalized);
}

function looksLikeNamedHeading(text: string): boolean {
  const normalized = text.trim();
  return /^(pr[oó]logo|prologo|prefacio|introducci[oó]n|conclusi[oó]n|ep[ií]logo|anexo|ap[eé]ndice)\b/i.test(
    normalized
  );
}

function looksLikeAllCapsHeading(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length === 0 || normalized.length > 90) {
    return false;
  }

  const letterOnly = normalized.replace(/[^A-Za-zÁÉÍÓÚÑÜ\s]/g, "");
  const words = letterOnly.split(/\s+/).filter(Boolean);
  return (
    words.length > 0 &&
    words.length <= 10 &&
    letterOnly.length >= 4 &&
    letterOnly === letterOnly.toUpperCase()
  );
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter(Boolean);
}

export function detectLanguage(
  text: string,
  declaredLanguage: string
): DetectedLanguage {
  const tokens = tokenize(text).slice(0, 4000);
  const spanishHits = tokens.filter((token) => SPANISH_STOPWORDS.has(token)).length;
  const englishHits = tokens.filter((token) => ENGLISH_STOPWORDS.has(token)).length;
  const totalHits = spanishHits + englishHits;

  if (totalHits === 0) {
    return {
      code: declaredLanguage,
      confidence: 0.2,
      source: "declared_fallback",
    };
  }

  if (spanishHits === englishHits) {
    return {
      code: declaredLanguage,
      confidence: 0.5,
      source: "declared_fallback",
    };
  }

  const code = spanishHits > englishHits ? "es" : "en";
  const confidence = Math.min(
    0.99,
    Math.max(spanishHits, englishHits) / Math.max(totalHits, 1)
  );

  return {
    code,
    confidence,
    source: "detected",
  };
}

function buildBlocks(lines: string[]): {
  blocks: NormalizedManuscriptBlock[];
  headings: NormalizedManuscriptBlock[];
  chapters: NormalizedManuscriptChapter[];
} {
  const blocks: NormalizedManuscriptBlock[] = [];
  const headings: NormalizedManuscriptBlock[] = [];
  const chapterHeadingIndexes: Array<{ blockIndex: number; title: string }> = [];

  let paragraphLines: string[] = [];
  let paragraphStartLine = 0;

  const flushParagraph = (lineNumber: number) => {
    if (paragraphLines.length === 0) {
      return;
    }

    const text = paragraphLines.join(" ");
    blocks.push({
      id: createFoundationId(),
      kind: "paragraph",
      text,
      line_start: paragraphStartLine,
      line_end: lineNumber - 1,
      heading_level: null,
    });
    paragraphLines = [];
    paragraphStartLine = 0;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const text = normalizeLine(line);

    if (!text) {
      flushParagraph(lineNumber);
      blocks.push({
        id: createFoundationId(),
        kind: "blank",
        text: "",
        line_start: lineNumber,
        line_end: lineNumber,
        heading_level: null,
      });
      return;
    }

    const isHeading =
      looksLikeChapterHeading(text) ||
      looksLikeNamedHeading(text) ||
      looksLikeAllCapsHeading(text);

    if (isHeading) {
      flushParagraph(lineNumber);
      const headingBlock: NormalizedManuscriptBlock = {
        id: createFoundationId(),
        kind: "heading",
        text,
        line_start: lineNumber,
        line_end: lineNumber,
        heading_level: 1,
      };
      const blockIndex = blocks.push(headingBlock) - 1;
      headings.push(headingBlock);

      if (looksLikeChapterHeading(text) || looksLikeNamedHeading(text)) {
        chapterHeadingIndexes.push({ blockIndex, title: text });
      }
      return;
    }

    if (paragraphLines.length === 0) {
      paragraphStartLine = lineNumber;
    }
    paragraphLines.push(text);
  });

  flushParagraph(lines.length + 1);

  const chapters: NormalizedManuscriptChapter[] = [];
  if (chapterHeadingIndexes.length === 0) {
    const firstContentBlockIndex = blocks.findIndex((block) => block.kind !== "blank");
    const lastContentBlockIndex = [...blocks]
      .reverse()
      .findIndex((block) => block.kind !== "blank");

    if (firstContentBlockIndex >= 0 && lastContentBlockIndex >= 0) {
      const endBlockIndex = blocks.length - 1 - lastContentBlockIndex;
      chapters.push({
        id: createFoundationId(),
        title: "Documento completo",
        heading_block_id: null,
        start_block_index: firstContentBlockIndex,
        end_block_index: endBlockIndex,
        start_line: blocks[firstContentBlockIndex]?.line_start ?? 1,
        end_line: blocks[endBlockIndex]?.line_end ?? lines.length,
      });
    }
  } else {
    chapterHeadingIndexes.forEach((chapter, index) => {
      const nextChapter = chapterHeadingIndexes[index + 1];
      const startBlock = blocks[chapter.blockIndex];
      const endBlockIndex = nextChapter ? nextChapter.blockIndex - 1 : blocks.length - 1;
      const endBlock = blocks[endBlockIndex];

      chapters.push({
        id: createFoundationId(),
        title: chapter.title,
        heading_block_id: startBlock?.id ?? null,
        start_block_index: chapter.blockIndex,
        end_block_index: endBlockIndex,
        start_line: startBlock?.line_start ?? 1,
        end_line: endBlock?.line_end ?? lines.length,
      });
    });
  }

  return { blocks, headings, chapters };
}

function buildStats(
  normalizedText: string,
  blocks: NormalizedManuscriptBlock[],
  headings: NormalizedManuscriptBlock[],
  chapters: NormalizedManuscriptChapter[]
): NormalizedManuscriptStats {
  const nonBlankBlocks = blocks.filter((block) => block.kind !== "blank");
  const words = tokenize(normalizedText);
  const lines = normalizedText.split("\n");

  return {
    character_count: normalizedText.length,
    word_count: words.length,
    line_count: lines.length,
    paragraph_count: nonBlankBlocks.filter((block) => block.kind === "paragraph").length,
    heading_count: headings.length,
    chapter_count: chapters.length,
  };
}

export function buildNormalizedManuscriptDocument(input: {
  projectId: string;
  sourceAssetId: string;
  sourceFileName: string;
  mimeType: string;
  declaredLanguage: string;
  rawText: string;
}): NormalizedManuscriptDocument {
  const rawText = input.rawText.replace(/^\uFEFF/, "");
  const normalizedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lines = normalizedText.split("\n");
  const { blocks, headings, chapters } = buildBlocks(lines);
  const detectedLanguage = detectLanguage(normalizedText, input.declaredLanguage);
  const stats = buildStats(normalizedText, blocks, headings, chapters);

  return {
    schema_version: 1,
    project_id: input.projectId,
    source_asset_id: input.sourceAssetId,
    source_file_name: input.sourceFileName,
    mime_type: input.mimeType,
    declared_language: input.declaredLanguage,
    detected_language: detectedLanguage,
    raw_text: rawText,
    normalized_text: normalizedText,
    stats,
    headings,
    chapters,
    blocks,
    normalized_at: createFoundationTimestamp(),
  };
}
