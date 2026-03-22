/* ------------------------------------------------------------------ */
/*  eBook Production Pipeline                                          */
/*  Orchestrates the eBook production flow from manuscript to export    */
/* ------------------------------------------------------------------ */

import type {
  EbookProjectConfig,
  EbookStage,
  EbookStageKey,
  EbookStageStatus,
  EbookStructure,
  EbookChapter,
  EbookFrontMatter,
  EbookBackMatter,
  EbookValidationResult,
  EbookExportPackage,
  EbookExportFile,
  EbookExportFormat,
} from "./types";
import { EBOOK_STAGE_KEYS, EBOOK_STAGE_PROGRESS } from "./types";
import { validateEbook } from "./ebook-validation";

/* ------------------------------------------------------------------ */
/*  Pipeline State                                                     */
/* ------------------------------------------------------------------ */

export interface EbookPipelineState {
  projectId: string;
  config: EbookProjectConfig;
  stages: EbookStage[];
  structure: EbookStructure | null;
  validation: EbookValidationResult | null;
  exportPackage: EbookExportPackage | null;
  currentStage: EbookStageKey;
  progressPercent: number;
  status: "idle" | "running" | "paused" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Initialize Pipeline                                                */
/* ------------------------------------------------------------------ */

export function initializeEbookPipeline(
  projectId: string,
  config: EbookProjectConfig
): EbookPipelineState {
  const now = new Date().toISOString();

  const stages: EbookStage[] = EBOOK_STAGE_KEYS.map((key) => ({
    id: `${projectId}_ebook_${key}`,
    projectId,
    stageKey: key,
    status: "pending" as EbookStageStatus,
    startedAt: null,
    completedAt: null,
    approvedBy: null,
    notes: null,
    validationErrors: [],
    createdAt: now,
  }));

  return {
    projectId,
    config,
    stages,
    structure: null,
    validation: null,
    exportPackage: null,
    currentStage: "manuscript_prep",
    progressPercent: 0,
    status: "idle",
    startedAt: null,
    completedAt: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Stage Execution                                                    */
/* ------------------------------------------------------------------ */

export function advanceEbookStage(
  state: EbookPipelineState,
  completedStageKey: EbookStageKey,
  approvedBy?: string
): EbookPipelineState {
  const now = new Date().toISOString();
  const currentIndex = EBOOK_STAGE_KEYS.indexOf(completedStageKey);
  const nextIndex = currentIndex + 1;

  const updatedStages = state.stages.map((stage) => {
    if (stage.stageKey === completedStageKey) {
      return {
        ...stage,
        status: "completed" as EbookStageStatus,
        completedAt: now,
        approvedBy: approvedBy ?? null,
      };
    }
    // Start next stage automatically
    if (nextIndex < EBOOK_STAGE_KEYS.length && stage.stageKey === EBOOK_STAGE_KEYS[nextIndex]) {
      return {
        ...stage,
        status: "in_progress" as EbookStageStatus,
        startedAt: now,
      };
    }
    return stage;
  });

  const isLastStage = nextIndex >= EBOOK_STAGE_KEYS.length;
  const nextStage = isLastStage ? completedStageKey : EBOOK_STAGE_KEYS[nextIndex];

  return {
    ...state,
    stages: updatedStages,
    currentStage: nextStage,
    progressPercent: EBOOK_STAGE_PROGRESS[completedStageKey],
    status: isLastStage ? "completed" : "running",
    completedAt: isLastStage ? now : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Manuscript Preparation (AI-assisted)                               */
/* ------------------------------------------------------------------ */

export interface ManuscriptPrepResult {
  cleanedWordCount: number;
  removedPrintFormatting: string[];
  preservedStructure: boolean;
  chapterCount: number;
  issues: string[];
}

/**
 * Prepare manuscript for eBook production.
 * Cleans print-only formatting while preserving structure and meaning.
 */
export function prepareManuscriptForEbook(
  _projectId: string,
  config: EbookProjectConfig
): ManuscriptPrepResult {
  // This would integrate with AI service in production
  const cleanupActions: string[] = [];

  if (config.origin === "print_adaptation") {
    cleanupActions.push(
      "Removed page break markers",
      "Cleaned fixed-width spacing",
      "Removed print-specific headers/footers",
      "Converted page references to chapter references"
    );
  }

  cleanupActions.push(
    "Normalized heading hierarchy",
    "Cleaned unnecessary inline styles",
    "Preserved semantic HTML structure",
    "Ensured consistent paragraph spacing"
  );

  return {
    cleanedWordCount: 0, // Populated by actual processing
    removedPrintFormatting: cleanupActions,
    preservedStructure: true,
    chapterCount: 0,
    issues: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Structure Analysis                                                 */
/* ------------------------------------------------------------------ */

/**
 * Analyze manuscript structure and generate eBook structure.
 */
export function analyzeEbookStructure(
  projectId: string,
  chapters: EbookChapter[],
  config: EbookProjectConfig
): EbookStructure {
  const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const hasComplexLayout = chapters.some((ch) => ch.requiresFixedLayout || ch.hasImages);

  // Determine recommended type based on content analysis
  let recommendedType = config.ebookType;
  if (config.ebookType === "auto_detect") {
    if (hasComplexLayout) {
      recommendedType = "fixed_layout";
    } else {
      recommendedType = "reflowable";
    }
  }

  const frontMatter: EbookFrontMatter = {
    titlePage: true,
    copyrightPage: true,
    dedication: config.includeDedication ? null : null, // Set by user
    acknowledgments: config.includeAcknowledgments ? null : null,
    tableOfContents: true,
    foreword: null,
    preface: null,
  };

  const backMatter: EbookBackMatter = {
    authorBio: config.includeAuthorBio ? null : null,
    glossary: false,
    bibliography: false,
    index: false,
    appendices: [],
    alsoByAuthor: [],
  };

  return {
    projectId,
    chapters,
    frontMatter,
    backMatter,
    totalWordCount,
    estimatedReadingTime: Math.ceil(totalWordCount / 250), // ~250 words per minute
    hasComplexLayout,
    recommendedType,
  };
}

/* ------------------------------------------------------------------ */
/*  Front Matter Generation                                            */
/* ------------------------------------------------------------------ */

export interface FrontMatterContent {
  titlePageHtml: string;
  copyrightPageHtml: string;
  dedicationHtml: string | null;
  acknowledgementsHtml: string | null;
  tocHtml: string;
}

/**
 * Generate professional front matter for eBook.
 */
export function generateFrontMatter(
  title: string,
  author: string,
  config: EbookProjectConfig,
  structure: EbookStructure
): FrontMatterContent {
  const year = new Date().getFullYear();
  const isSpanish = config.language === "es";

  const titlePageHtml = `
<section epub:type="titlepage" class="title-page">
  <h1 class="book-title">${title}</h1>
  <p class="book-author">${author}</p>
</section>`;

  const copyrightPageHtml = `
<section epub:type="copyright-page" class="copyright-page">
  <p>&copy; ${year} ${author}. ${isSpanish ? "Todos los derechos reservados." : "All rights reserved."}</p>
  <p>${isSpanish ? "Publicado por" : "Published by"} Reino Editorial</p>
  <p>${isSpanish
    ? "Ninguna parte de este libro puede ser reproducida sin permiso escrito del autor."
    : "No part of this book may be reproduced without written permission from the author."
  }</p>
</section>`;

  const dedicationHtml = structure.frontMatter.dedication
    ? `<section epub:type="dedication" class="dedication"><p>${structure.frontMatter.dedication}</p></section>`
    : null;

  const acknowledgementsHtml = structure.frontMatter.acknowledgments
    ? `<section epub:type="acknowledgments" class="acknowledgments"><h2>${isSpanish ? "Agradecimientos" : "Acknowledgments"}</h2><p>${structure.frontMatter.acknowledgments}</p></section>`
    : null;

  const tocEntries = structure.chapters
    .map(
      (ch) =>
        `<li class="toc-entry toc-level-${ch.level}"><a href="#chapter-${ch.order}">${ch.title}</a></li>`
    )
    .join("\n");

  const tocHtml = `
<nav epub:type="toc" id="toc">
  <h2>${isSpanish ? "Tabla de Contenido" : "Table of Contents"}</h2>
  <ol class="toc-list">
    ${tocEntries}
  </ol>
</nav>`;

  return {
    titlePageHtml,
    copyrightPageHtml,
    dedicationHtml,
    acknowledgementsHtml,
    tocHtml,
  };
}

/* ------------------------------------------------------------------ */
/*  Export Package Generation                                          */
/* ------------------------------------------------------------------ */

/**
 * Generate the expected export files for an eBook project.
 */
export function generateEbookExportFiles(
  projectId: string,
  config: EbookProjectConfig
): EbookExportFile[] {
  const files: EbookExportFile[] = [];

  // EPUB is always generated
  files.push({
    id: `${projectId}_epub`,
    projectId,
    format: "epub" as EbookExportFormat,
    fileName: "ebook.epub",
    storagePath: null,
    sizeBytes: null,
    version: 1,
    status: "pending",
    generatedAt: null,
    errorMessage: null,
  });

  // KPF for Amazon KDP
  if (config.destination === "amazon_kdp" || config.destination === "both") {
    files.push({
      id: `${projectId}_kpf`,
      projectId,
      format: "kpf" as EbookExportFormat,
      fileName: "ebook.kpf",
      storagePath: null,
      sizeBytes: null,
      version: 1,
      status: "pending",
      generatedAt: null,
      errorMessage: null,
    });
  }

  // HTML preview always available
  files.push({
    id: `${projectId}_preview`,
    projectId,
    format: "html_preview" as EbookExportFormat,
    fileName: "ebook-preview.html",
    storagePath: null,
    sizeBytes: null,
    version: 1,
    status: "pending",
    generatedAt: null,
    errorMessage: null,
  });

  return files;
}

/**
 * Create an export package for the eBook project.
 */
export function createEbookExportPackage(
  projectId: string,
  config: EbookProjectConfig,
  validation: EbookValidationResult | null
): EbookExportPackage {
  const now = new Date().toISOString();
  const files = generateEbookExportFiles(projectId, config);

  return {
    projectId,
    files,
    config,
    validation,
    status: validation?.isValid ? "building" : "failed",
    createdAt: now,
    completedAt: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Full Pipeline Execution                                            */
/* ------------------------------------------------------------------ */

/**
 * Run the complete eBook pipeline (for automation).
 * In production, each stage would be triggered asynchronously.
 */
export function runEbookPipeline(
  projectId: string,
  config: EbookProjectConfig,
  chapters: EbookChapter[],
  title: string,
  author: string
): {
  state: EbookPipelineState;
  structure: EbookStructure;
  frontMatter: FrontMatterContent;
  validation: EbookValidationResult;
  exportPackage: EbookExportPackage;
} {
  // 1. Initialize pipeline
  let state = initializeEbookPipeline(projectId, config);
  state = { ...state, status: "running", startedAt: new Date().toISOString() };

  // 2. Manuscript preparation
  prepareManuscriptForEbook(projectId, config);
  state = advanceEbookStage(state, "manuscript_prep");

  // 3. Structural cleanup & analysis
  const structure = analyzeEbookStructure(projectId, chapters, config);
  state = advanceEbookStage(state, "structural_cleanup");

  // 4. Front matter generation
  const frontMatter = generateFrontMatter(title, author, config, structure);
  state = advanceEbookStage(state, "front_matter");

  // 5. TOC generation (included in front matter)
  state = advanceEbookStage(state, "toc_generation");

  // 6. Reflowable preparation
  state = advanceEbookStage(state, "reflowable_prep");

  // 7. Validation
  const validation = validateEbook(projectId, structure, config);
  state = advanceEbookStage(state, "validation");

  // 8. Final export
  const exportPackage = createEbookExportPackage(projectId, config, validation);
  state = advanceEbookStage(state, "final_export");

  state = {
    ...state,
    structure,
    validation,
    exportPackage,
  };

  return { state, structure, frontMatter, validation, exportPackage };
}
