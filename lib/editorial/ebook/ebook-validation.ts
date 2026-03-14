/* ------------------------------------------------------------------ */
/*  eBook Validation Service                                           */
/*  Validates eBook structure, navigation, formatting, and metadata    */
/* ------------------------------------------------------------------ */

import type {
  EbookProjectConfig,
  EbookStructure,
  EbookValidationResult,
  EbookValidationIssue,
  ValidationSeverity,
} from "./types";

/**
 * Validate an eBook project for export readiness.
 * Checks structure, navigation, front matter, formatting, and compatibility.
 */
export function validateEbook(
  projectId: string,
  structure: EbookStructure,
  config: EbookProjectConfig
): EbookValidationResult {
  const issues: EbookValidationIssue[] = [];
  let issueCounter = 0;

  function addIssue(
    severity: ValidationSeverity,
    category: EbookValidationIssue["category"],
    message: string,
    details?: string,
    chapterId?: string,
    autoFixable = false
  ) {
    issueCounter++;
    issues.push({
      id: `val_${projectId}_${issueCounter}`,
      severity,
      category,
      message,
      details,
      chapterId,
      autoFixable,
    });
  }

  // ─── Structure Validation ─────────────────────────────────────────
  if (structure.chapters.length === 0) {
    addIssue("error", "structure", "El libro no tiene capitulos definidos.");
  }

  // Check chapter hierarchy
  const headingLevels = structure.chapters.map((ch) => ch.level);
  if (headingLevels.length > 0 && headingLevels[0] !== 1) {
    addIssue(
      "warning",
      "structure",
      "El primer capitulo no tiene nivel de encabezado H1.",
      "Se recomienda que el primer capitulo use H1 como nivel principal.",
      structure.chapters[0]?.id,
      true
    );
  }

  // Check for empty chapters
  for (const chapter of structure.chapters) {
    if (chapter.wordCount === 0) {
      addIssue(
        "warning",
        "structure",
        `El capitulo "${chapter.title}" no tiene contenido.`,
        "Los capitulos vacios pueden causar problemas en lectores digitales.",
        chapter.id
      );
    }
  }

  // Check heading level jumps (e.g., H1 -> H3 without H2)
  for (let i = 1; i < structure.chapters.length; i++) {
    const prev = structure.chapters[i - 1];
    const curr = structure.chapters[i];
    if (curr.level > prev.level + 1) {
      addIssue(
        "warning",
        "structure",
        `Salto de nivel de encabezado entre "${prev.title}" (H${prev.level}) y "${curr.title}" (H${curr.level}).`,
        "Los saltos de nivel pueden afectar la navegacion del eBook.",
        curr.id,
        true
      );
    }
  }

  // ─── Navigation Validation ────────────────────────────────────────
  if (!structure.frontMatter.tableOfContents) {
    addIssue(
      "error",
      "navigation",
      "La tabla de contenido no esta incluida.",
      "La tabla de contenido es obligatoria para eBooks profesionales."
    );
  }

  // Check for duplicate chapter titles
  const titles = structure.chapters.map((ch) => ch.title.toLowerCase().trim());
  const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (duplicates.length > 0) {
    addIssue(
      "warning",
      "navigation",
      `Se encontraron titulos de capitulo duplicados: ${[...new Set(duplicates)].join(", ")}`,
      "Los titulos duplicados pueden confundir la navegacion del eBook."
    );
  }

  // ─── Front Matter Validation ──────────────────────────────────────
  if (!structure.frontMatter.titlePage) {
    addIssue(
      "error",
      "front_matter",
      "La pagina de titulo no esta incluida.",
      "La pagina de titulo es obligatoria para eBooks profesionales."
    );
  }

  if (!structure.frontMatter.copyrightPage) {
    addIssue(
      "error",
      "front_matter",
      "La pagina de copyright no esta incluida.",
      "La pagina de copyright es obligatoria."
    );
  }

  if (config.includeDedication && !structure.frontMatter.dedication) {
    addIssue(
      "info",
      "front_matter",
      "La dedicatoria esta habilitada pero no tiene contenido.",
      "Agregue el texto de la dedicatoria antes de la exportacion final."
    );
  }

  if (config.includeAuthorBio && !structure.backMatter.authorBio) {
    addIssue(
      "info",
      "front_matter",
      "La biografia del autor esta habilitada pero no tiene contenido.",
      "Se recomienda incluir una biografia del autor."
    );
  }

  // ─── Formatting / Compatibility Validation ────────────────────────
  if (structure.hasComplexLayout && config.ebookType === "reflowable") {
    addIssue(
      "warning",
      "compatibility",
      "El libro contiene layout complejo pero el tipo seleccionado es reflowable.",
      "Considere usar fixed layout para contenido con imagenes o posicionamiento especifico.",
      undefined,
      false
    );
  }

  // Check for fixed layout chapters in reflowable mode
  const fixedLayoutChapters = structure.chapters.filter((ch) => ch.requiresFixedLayout);
  if (fixedLayoutChapters.length > 0 && config.ebookType === "reflowable") {
    for (const ch of fixedLayoutChapters) {
      addIssue(
        "warning",
        "formatting",
        `El capitulo "${ch.title}" requiere fixed layout pero el eBook es reflowable.`,
        "El contenido puede no mostrarse correctamente en todos los lectores.",
        ch.id
      );
    }
  }

  // Check for image-heavy chapters
  const imageChapters = structure.chapters.filter((ch) => ch.hasImages);
  if (imageChapters.length > structure.chapters.length * 0.5) {
    addIssue(
      "info",
      "compatibility",
      "Mas del 50% de los capitulos contienen imagenes.",
      "Considere fixed layout si las imagenes son esenciales para la comprension del contenido."
    );
  }

  // ─── Amazon KDP Specific Validation ───────────────────────────────
  if (config.destination === "amazon_kdp" || config.destination === "both") {
    // KDP requires minimum word count
    if (structure.totalWordCount < 2500) {
      addIssue(
        "warning",
        "compatibility",
        "El libro tiene menos de 2,500 palabras.",
        "Amazon KDP recomienda un minimo de 2,500 palabras para eBooks."
      );
    }

    // KDP requires table of contents for books > 10 chapters
    if (structure.chapters.length > 10 && !structure.frontMatter.tableOfContents) {
      addIssue(
        "error",
        "navigation",
        "Amazon KDP requiere tabla de contenido para libros con mas de 10 capitulos."
      );
    }
  }

  // ─── Metadata Validation ──────────────────────────────────────────
  // (Metadata validation is handled separately in the publishing module)

  // ─── Calculate Results ────────────────────────────────────────────
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    projectId,
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
    infoCount,
    validatedAt: new Date().toISOString(),
    requiresHumanReview: warningCount > 0 || fixedLayoutChapters.length > 0,
  };
}

/**
 * Quick validation check for eBook readiness.
 * Returns true if the basic structure is in place.
 */
export function isEbookReady(structure: EbookStructure): boolean {
  return (
    structure.chapters.length > 0 &&
    structure.frontMatter.titlePage &&
    structure.frontMatter.copyrightPage &&
    structure.frontMatter.tableOfContents
  );
}
