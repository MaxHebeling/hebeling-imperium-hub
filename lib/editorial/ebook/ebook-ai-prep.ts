/* ------------------------------------------------------------------ */
/*  eBook AI Manuscript Preparation                                    */
/*  AI-assisted cleanup and preparation for digital reading            */
/* ------------------------------------------------------------------ */

import type { EbookProjectConfig } from "./types";

/* ------------------------------------------------------------------ */
/*  AI Task Types                                                      */
/* ------------------------------------------------------------------ */

export type EbookAITaskType =
  | "clean_print_formatting"
  | "preserve_structure"
  | "generate_chapter_hierarchy"
  | "prepare_navigable_contents"
  | "validate_meaning_preservation"
  | "normalize_language";

export interface EbookAITask {
  id: string;
  projectId: string;
  taskType: EbookAITaskType;
  status: "pending" | "processing" | "completed" | "failed";
  result: EbookAITaskResult | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface EbookAITaskResult {
  success: boolean;
  changesApplied: string[];
  warnings: string[];
  preservedElements: string[];
}

/* ------------------------------------------------------------------ */
/*  AI System Prompts for eBook Preparation                            */
/* ------------------------------------------------------------------ */

export function getEbookPrepSystemPrompt(
  config: EbookProjectConfig
): string {
  const lang = config.language === "es" ? "Spanish" : "American English";
  const origin = config.origin === "print_adaptation"
    ? "This is an adaptation of an existing print edition."
    : "This is a new eBook project.";

  return `You are an expert eBook production specialist for Reino Editorial.
Your role is to prepare manuscripts for professional eBook output.

${origin}

CRITICAL RULES:
1. NEVER change the meaning of the text. Preserve the author's voice and intent.
2. Preserve all theological meaning and doctrinal content exactly as written.
3. Ensure natural ${lang} throughout the manuscript.
4. Clean unnecessary print-only formatting (page breaks, fixed spacing, headers/footers).
5. Preserve semantic structure (headings, paragraphs, lists, quotes).
6. Generate clean chapter hierarchy suitable for eBook navigation.
7. Prepare content for reflowable eBook reading experience.

FORMATTING TASKS:
- Remove manual page numbers and page references
- Clean fixed-width spacing and tab characters used for alignment
- Convert print-specific cross-references to chapter-based references
- Normalize heading levels (H1 for chapters, H2 for sections, etc.)
- Ensure paragraphs are properly separated
- Clean up orphaned formatting artifacts
- Preserve block quotes, poetry, and special text formatting
- Ensure images have alt text descriptions

STRUCTURE TASKS:
- Identify and mark chapter boundaries
- Generate navigable table of contents entries
- Identify front matter elements (title, copyright, dedication, etc.)
- Identify back matter elements (author bio, glossary, bibliography)
- Flag content that may require fixed layout treatment

OUTPUT FORMAT:
Return structured HTML suitable for EPUB conversion with:
- Proper heading hierarchy
- Semantic HTML elements (section, article, aside, blockquote)
- EPUB-specific attributes (epub:type)
- Clean, minimal CSS
- Accessible content structure`;
}

/* ------------------------------------------------------------------ */
/*  AI Cleanup Instructions by Task Type                               */
/* ------------------------------------------------------------------ */

export function getAITaskInstructions(
  taskType: EbookAITaskType,
  config: EbookProjectConfig
): string {
  const isSpanish = config.language === "es";

  const instructions: Record<EbookAITaskType, string> = {
    clean_print_formatting: isSpanish
      ? `Limpia todo el formato exclusivo de impresion del manuscrito:
- Elimina saltos de pagina manuales
- Elimina numeracion de paginas
- Limpia espaciado fijo y tabulaciones de alineacion
- Convierte referencias de pagina a referencias de capitulo
- Mantiene la estructura semantica del texto`
      : `Clean all print-only formatting from the manuscript:
- Remove manual page breaks
- Remove page numbering
- Clean fixed-width spacing and alignment tabs
- Convert page references to chapter references
- Preserve semantic text structure`,

    preserve_structure: isSpanish
      ? `Preserva la estructura completa del manuscrito:
- Mantiene la jerarquia de encabezados
- Preserva listas, citas y texto especial
- Mantiene separacion de parrafos
- Asegura que las secciones esten correctamente delimitadas`
      : `Preserve the complete manuscript structure:
- Maintain heading hierarchy
- Preserve lists, quotes, and special text
- Maintain paragraph separation
- Ensure sections are properly delimited`,

    generate_chapter_hierarchy: isSpanish
      ? `Genera una jerarquia limpia de capitulos:
- H1 para titulos de capitulos principales
- H2 para secciones dentro de capitulos
- H3 para subsecciones
- Asegura numeracion consistente
- Identifica capitulos sin titulo`
      : `Generate a clean chapter hierarchy:
- H1 for main chapter titles
- H2 for sections within chapters
- H3 for subsections
- Ensure consistent numbering
- Identify untitled chapters`,

    prepare_navigable_contents: isSpanish
      ? `Prepara una tabla de contenido navegable:
- Genera entradas para cada capitulo
- Incluye secciones principales (H2)
- Asegura que cada entrada tenga un ancla valida
- Formato compatible con EPUB NCX/nav`
      : `Prepare a navigable table of contents:
- Generate entries for each chapter
- Include main sections (H2)
- Ensure each entry has a valid anchor
- EPUB NCX/nav compatible format`,

    validate_meaning_preservation: isSpanish
      ? `Valida que el significado del texto se ha preservado:
- Compara contenido original con version procesada
- Verifica que no se han perdido parrafos
- Confirma que citas textuales estan intactas
- Asegura que el tono y voz del autor se mantienen`
      : `Validate that text meaning has been preserved:
- Compare original content with processed version
- Verify no paragraphs have been lost
- Confirm direct quotes are intact
- Ensure author's tone and voice are maintained`,

    normalize_language: isSpanish
      ? `Normaliza el idioma para lectura digital:
- Corrige errores tipograficos menores
- Normaliza puntuacion (comillas, guiones, etc.)
- Asegura formato consistente de numeros y fechas
- NO cambia el contenido ni significado`
      : `Normalize language for digital reading:
- Fix minor typographical errors
- Normalize punctuation (quotes, dashes, etc.)
- Ensure consistent number and date formatting
- DO NOT change content or meaning`,
  };

  return instructions[taskType];
}

/* ------------------------------------------------------------------ */
/*  Generate AI Tasks for eBook Preparation                            */
/* ------------------------------------------------------------------ */

/**
 * Generate the complete list of AI tasks needed for eBook preparation.
 */
export function generateEbookAITasks(
  projectId: string,
  config: EbookProjectConfig
): EbookAITask[] {
  const taskTypes: EbookAITaskType[] = [
    "clean_print_formatting",
    "preserve_structure",
    "generate_chapter_hierarchy",
    "prepare_navigable_contents",
    "validate_meaning_preservation",
    "normalize_language",
  ];

  // For new ebooks, skip print cleanup
  const filteredTasks = config.origin === "new_ebook"
    ? taskTypes.filter((t) => t !== "clean_print_formatting")
    : taskTypes;

  return filteredTasks.map((taskType, index) => ({
    id: `${projectId}_ai_${taskType}`,
    projectId,
    taskType,
    status: index === 0 ? "pending" : "pending",
    result: null,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
  }));
}
