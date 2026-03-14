/**
 * AI Layout Director — Professional Book Interior Design
 *
 * Responsible for designing the interior layout of books produced through
 * the editorial pipeline. Produces professional publishing-quality interior
 * designs suitable for Amazon KDP print, ebook, and bookstore distribution.
 *
 * Supports three design decision modes:
 * 1. Editorial Prompt — staff defines layout direction
 * 2. Author Prompt — client provides design idea
 * 3. AI Decision — AI analyzes manuscript and chooses style
 */

// ─── Design Decision Modes ──────────────────────────────────────────

export type LayoutDesignMode = "editorial_prompt" | "author_prompt" | "ai_decision";

export interface LayoutDesignInput {
  mode: LayoutDesignMode;
  /** Design prompt provided by staff or author (modes 1 & 2) */
  prompt?: string;
  /** Manuscript metadata for AI analysis (mode 3) */
  manuscriptMetadata?: {
    genre: string;
    tone: string;
    audience: string;
    wordCount: number;
    chapterCount: number;
    language: string;
    hasImages: boolean;
  };
}

// ─── Typography System ──────────────────────────────────────────────

export interface TypographyConfig {
  /** Body text font */
  bodyFont: string;
  bodySize: number;
  bodyLineHeight: number;
  /** Chapter title font */
  chapterTitleFont: string;
  chapterTitleSize: number;
  /** Section subtitle font */
  subtitleFont: string;
  subtitleSize: number;
  /** Running header style */
  headerFont: string;
  headerSize: number;
  /** Page number font */
  pageNumberFont: string;
  pageNumberSize: number;
  /** Paragraph first-line indent in mm */
  paragraphIndent: number;
  /** Drop cap on chapter opening paragraphs */
  useDropCaps: boolean;
  /** Drop cap lines (2-4) */
  dropCapLines: number;
}

export interface FontCombination {
  id: string;
  name: string;
  description: string;
  bodyFont: string;
  headingFont: string;
  accentFont: string;
  style: LayoutStyle;
}

/**
 * Professional font combinations for book interior design.
 * Uses PDFKit built-in fonts for reliability.
 */
export const FONT_COMBINATIONS: FontCombination[] = [
  {
    id: "classic_serif",
    name: "Clasico Serif",
    description: "Combinacion clasica para ficcion y literatura general. Elegante y legible.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Times-Italic",
    style: "literary",
  },
  {
    id: "modern_clean",
    name: "Moderno Limpio",
    description: "Diseno moderno y minimalista. Ideal para liderazgo y no-ficcion contemporanea.",
    bodyFont: "Helvetica",
    headingFont: "Helvetica-Bold",
    accentFont: "Helvetica-Oblique",
    style: "minimalist",
  },
  {
    id: "elegant_traditional",
    name: "Elegante Tradicional",
    description: "Tipografia tradicional de editorial premium. Para devocionales y textos formales.",
    bodyFont: "Times-Roman",
    headingFont: "Times-Bold",
    accentFont: "Times-Italic",
    style: "inspirational",
  },
  {
    id: "contemporary_mix",
    name: "Contemporaneo Mixto",
    description: "Mezcla serif para cuerpo y sans-serif para titulos. Versatil y profesional.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Helvetica-Oblique",
    style: "modern_leadership",
  },
  {
    id: "academic_formal",
    name: "Academico Formal",
    description: "Para textos academicos, estudios biblicos y manuales de referencia.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Courier",
    style: "academic",
  },
];

// ─── Layout Styles ──────────────────────────────────────────────────

export type LayoutStyle =
  | "minimalist"
  | "modern_leadership"
  | "literary"
  | "inspirational"
  | "academic"
  | "narrative";

export interface LayoutStyleConfig {
  id: LayoutStyle;
  name: string;
  description: string;
  /** Typography selection */
  typography: TypographyConfig;
  /** Chapter opening design */
  chapterOpener: ChapterOpenerStyle;
  /** Section break style */
  sectionBreak: "asterisks" | "line" | "ornament" | "space";
  /** Front matter style */
  frontMatterStyle: "classic" | "modern" | "minimal";
  /** Overall spacing density */
  spacingDensity: "airy" | "balanced" | "compact";
  /** Recommended genres */
  recommendedFor: string[];
}

// ─── Chapter Opening Design ─────────────────────────────────────────

export type ChapterOpenerStyle =
  | "centered_classic"     // Large number + title centered, decorative line
  | "left_modern"          // Left-aligned, large number, modern typography
  | "drop_number"          // Oversized chapter number with drop cap
  | "minimal_title"        // Just the title, clean and minimal
  | "ornamental"           // Subtle ornamental element with title
  | "full_page";           // Chapter title takes full page

export interface ChapterOpenerConfig {
  style: ChapterOpenerStyle;
  /** Show chapter number */
  showNumber: boolean;
  /** Number format: numeric, roman, spelled */
  numberFormat: "numeric" | "roman" | "spelled";
  /** Show chapter title */
  showTitle: boolean;
  /** Use drop cap for first paragraph */
  useDropCap: boolean;
  /** Decorative element type */
  decorativeElement: "line" | "dots" | "ornament" | "none";
  /** Vertical offset from top of page in mm */
  topOffset: number;
}

// ─── Layout Style Presets ───────────────────────────────────────────

export const LAYOUT_STYLE_PRESETS: LayoutStyleConfig[] = [
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Diseno limpio y moderno. Espacios generosos, tipografia clara.",
    typography: {
      bodyFont: "Helvetica",
      bodySize: 11,
      bodyLineHeight: 1.5,
      chapterTitleFont: "Helvetica-Bold",
      chapterTitleSize: 28,
      subtitleFont: "Helvetica",
      subtitleSize: 14,
      headerFont: "Helvetica",
      headerSize: 8,
      pageNumberFont: "Helvetica",
      pageNumberSize: 9,
      paragraphIndent: 7,
      useDropCaps: false,
      dropCapLines: 0,
    },
    chapterOpener: "minimal_title",
    sectionBreak: "space",
    frontMatterStyle: "minimal",
    spacingDensity: "airy",
    recommendedFor: ["liderazgo", "negocios", "autoayuda", "no-ficcion moderna"],
  },
  {
    id: "modern_leadership",
    name: "Liderazgo Moderno",
    description: "Profesional y contundente. Titulos fuertes, jerarquia clara.",
    typography: {
      bodyFont: "Times-Roman",
      bodySize: 11,
      bodyLineHeight: 1.5,
      chapterTitleFont: "Helvetica-Bold",
      chapterTitleSize: 32,
      subtitleFont: "Helvetica",
      subtitleSize: 14,
      headerFont: "Helvetica",
      headerSize: 8,
      pageNumberFont: "Helvetica",
      pageNumberSize: 9,
      paragraphIndent: 7,
      useDropCaps: false,
      dropCapLines: 0,
    },
    chapterOpener: "left_modern",
    sectionBreak: "line",
    frontMatterStyle: "modern",
    spacingDensity: "balanced",
    recommendedFor: ["liderazgo", "mentoria", "emprendimiento"],
  },
  {
    id: "literary",
    name: "Literario",
    description: "Clasico y elegante. Para ficcion, memorias y narrativa.",
    typography: {
      bodyFont: "Times-Roman",
      bodySize: 11,
      bodyLineHeight: 1.5,
      chapterTitleFont: "Times-Bold",
      chapterTitleSize: 24,
      subtitleFont: "Times-Italic",
      subtitleSize: 13,
      headerFont: "Times-Roman",
      headerSize: 8,
      pageNumberFont: "Times-Roman",
      pageNumberSize: 9,
      paragraphIndent: 8,
      useDropCaps: true,
      dropCapLines: 3,
    },
    chapterOpener: "centered_classic",
    sectionBreak: "asterisks",
    frontMatterStyle: "classic",
    spacingDensity: "balanced",
    recommendedFor: ["ficcion", "memorias", "narrativa", "novela"],
  },
  {
    id: "inspirational",
    name: "Inspiracional",
    description: "Calido y acogedor. Para devocionales, oracion y libros pastorales.",
    typography: {
      bodyFont: "Times-Roman",
      bodySize: 11.5,
      bodyLineHeight: 1.55,
      chapterTitleFont: "Times-Bold",
      chapterTitleSize: 26,
      subtitleFont: "Times-Italic",
      subtitleSize: 13,
      headerFont: "Times-Roman",
      headerSize: 8,
      pageNumberFont: "Times-Roman",
      pageNumberSize: 9,
      paragraphIndent: 7,
      useDropCaps: true,
      dropCapLines: 2,
    },
    chapterOpener: "ornamental",
    sectionBreak: "ornament",
    frontMatterStyle: "classic",
    spacingDensity: "airy",
    recommendedFor: ["devocional", "oracion", "pastoral", "inspiracional", "fe"],
  },
  {
    id: "academic",
    name: "Academico",
    description: "Estructurado y formal. Para estudios biblicos, manuales y referencia.",
    typography: {
      bodyFont: "Times-Roman",
      bodySize: 10.5,
      bodyLineHeight: 1.45,
      chapterTitleFont: "Helvetica-Bold",
      chapterTitleSize: 22,
      subtitleFont: "Helvetica",
      subtitleSize: 12,
      headerFont: "Helvetica",
      headerSize: 7.5,
      pageNumberFont: "Helvetica",
      pageNumberSize: 8,
      paragraphIndent: 5,
      useDropCaps: false,
      dropCapLines: 0,
    },
    chapterOpener: "left_modern",
    sectionBreak: "line",
    frontMatterStyle: "modern",
    spacingDensity: "compact",
    recommendedFor: ["estudio biblico", "manual", "academico", "referencia", "teologia"],
  },
  {
    id: "narrative",
    name: "Narrativo",
    description: "Fluido y envolvente. Para historias, testimonios y cronicas.",
    typography: {
      bodyFont: "Times-Roman",
      bodySize: 11,
      bodyLineHeight: 1.5,
      chapterTitleFont: "Times-Bold",
      chapterTitleSize: 26,
      subtitleFont: "Times-Italic",
      subtitleSize: 14,
      headerFont: "Times-Italic",
      headerSize: 8,
      pageNumberFont: "Times-Roman",
      pageNumberSize: 9,
      paragraphIndent: 8,
      useDropCaps: true,
      dropCapLines: 3,
    },
    chapterOpener: "drop_number",
    sectionBreak: "asterisks",
    frontMatterStyle: "classic",
    spacingDensity: "balanced",
    recommendedFor: ["testimonio", "cronica", "biografia", "historia"],
  },
];

// ─── Front Matter Templates ─────────────────────────────────────────

export interface FrontMatterConfig {
  /** Pages to include in front matter */
  pages: FrontMatterPage[];
}

export type FrontMatterPage =
  | "half_title"
  | "title"
  | "copyright"
  | "dedication"
  | "acknowledgments"
  | "table_of_contents"
  | "preface"
  | "introduction";

export interface BackMatterConfig {
  pages: BackMatterPage[];
}

export type BackMatterPage =
  | "author_bio"
  | "notes"
  | "references"
  | "appendix"
  | "resources"
  | "also_by";

export const DEFAULT_FRONT_MATTER: FrontMatterConfig = {
  pages: [
    "half_title",
    "title",
    "copyright",
    "dedication",
    "table_of_contents",
  ],
};

export const DEFAULT_BACK_MATTER: BackMatterConfig = {
  pages: ["author_bio"],
};

// ─── Complete Layout Concept ────────────────────────────────────────

export interface LayoutConcept {
  /** Unique ID for this concept */
  id: string;
  /** How the concept was generated */
  designMode: LayoutDesignMode;
  /** Selected layout style */
  style: LayoutStyleConfig;
  /** Selected font combination */
  fonts: FontCombination;
  /** Chapter opener configuration */
  chapterOpener: ChapterOpenerConfig;
  /** Front matter configuration */
  frontMatter: FrontMatterConfig;
  /** Back matter configuration */
  backMatter: BackMatterConfig;
  /** AI reasoning for the design choices (when mode is ai_decision) */
  designRationale: string;
  /** Page size preset ID */
  pagePresetId: string;
  /** Approval status */
  status: "draft" | "approved" | "rejected";
}

// ─── AI Layout Analysis ─────────────────────────────────────────────

/** Genre to layout style mapping */
const GENRE_STYLE_MAP: Record<string, LayoutStyle> = {
  ficcion: "literary",
  novela: "narrative",
  narrativa: "narrative",
  memorias: "literary",
  biografia: "narrative",
  liderazgo: "modern_leadership",
  negocios: "modern_leadership",
  emprendimiento: "modern_leadership",
  autoayuda: "minimalist",
  devocional: "inspirational",
  oracion: "inspirational",
  pastoral: "inspirational",
  inspiracional: "inspirational",
  fe: "inspirational",
  estudio_biblico: "academic",
  teologia: "academic",
  manual: "academic",
  referencia: "academic",
  testimonio: "narrative",
  cronica: "narrative",
  historia: "narrative",
  poesia: "literary",
  ensayo: "literary",
};

/**
 * Infer the best layout style based on manuscript metadata.
 * Used in AI Decision mode.
 */
export function inferLayoutStyle(metadata: {
  genre: string;
  tone: string;
  audience: string;
  wordCount: number;
}): LayoutStyle {
  const genreLower = metadata.genre.toLowerCase().replace(/\s+/g, "_");

  // Direct genre match
  if (GENRE_STYLE_MAP[genreLower]) {
    return GENRE_STYLE_MAP[genreLower];
  }

  // Partial match
  for (const [key, style] of Object.entries(GENRE_STYLE_MAP)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      return style;
    }
  }

  // Tone-based inference
  const toneLower = metadata.tone.toLowerCase();
  if (toneLower.includes("pastoral") || toneLower.includes("devocional")) {
    return "inspirational";
  }
  if (toneLower.includes("formal") || toneLower.includes("academico")) {
    return "academic";
  }
  if (toneLower.includes("narrativ") || toneLower.includes("historia")) {
    return "narrative";
  }
  if (toneLower.includes("modern") || toneLower.includes("contemporan")) {
    return "minimalist";
  }

  // Default to literary for fiction-length, inspirational for shorter works
  return metadata.wordCount > 40000 ? "literary" : "inspirational";
}

/**
 * Get the layout style preset by ID.
 */
export function getLayoutStylePreset(styleId: LayoutStyle): LayoutStyleConfig | undefined {
  return LAYOUT_STYLE_PRESETS.find((s) => s.id === styleId);
}

/**
 * Get the best font combination for a layout style.
 */
export function getFontCombinationForStyle(style: LayoutStyle): FontCombination {
  const match = FONT_COMBINATIONS.find((f) => f.style === style);
  return match ?? FONT_COMBINATIONS[0];
}

/**
 * Build a default chapter opener config based on style.
 */
export function buildChapterOpenerConfig(
  style: ChapterOpenerStyle
): ChapterOpenerConfig {
  switch (style) {
    case "centered_classic":
      return {
        style: "centered_classic",
        showNumber: true,
        numberFormat: "roman",
        showTitle: true,
        useDropCap: true,
        decorativeElement: "line",
        topOffset: 60,
      };
    case "left_modern":
      return {
        style: "left_modern",
        showNumber: true,
        numberFormat: "numeric",
        showTitle: true,
        useDropCap: false,
        decorativeElement: "none",
        topOffset: 50,
      };
    case "drop_number":
      return {
        style: "drop_number",
        showNumber: true,
        numberFormat: "numeric",
        showTitle: true,
        useDropCap: true,
        decorativeElement: "none",
        topOffset: 40,
      };
    case "minimal_title":
      return {
        style: "minimal_title",
        showNumber: false,
        numberFormat: "numeric",
        showTitle: true,
        useDropCap: false,
        decorativeElement: "none",
        topOffset: 70,
      };
    case "ornamental":
      return {
        style: "ornamental",
        showNumber: true,
        numberFormat: "spelled",
        showTitle: true,
        useDropCap: true,
        decorativeElement: "ornament",
        topOffset: 55,
      };
    case "full_page":
      return {
        style: "full_page",
        showNumber: true,
        numberFormat: "roman",
        showTitle: true,
        useDropCap: false,
        decorativeElement: "ornament",
        topOffset: 0,
      };
  }
}

/**
 * Generate a complete layout concept based on design input.
 */
export function generateLayoutConcept(
  input: LayoutDesignInput,
  projectId: string
): LayoutConcept {
  let style: LayoutStyle = "inspirational";
  let rationale = "";

  switch (input.mode) {
    case "ai_decision": {
      if (input.manuscriptMetadata) {
        style = inferLayoutStyle(input.manuscriptMetadata);
        rationale = `Estilo "${style}" seleccionado automaticamente basado en: genero "${input.manuscriptMetadata.genre}", tono "${input.manuscriptMetadata.tone}", audiencia "${input.manuscriptMetadata.audience}", ${input.manuscriptMetadata.wordCount} palabras.`;
      }
      break;
    }
    case "editorial_prompt":
    case "author_prompt": {
      // Parse prompt for style hints
      const prompt = (input.prompt ?? "").toLowerCase();
      if (prompt.includes("minimal") || prompt.includes("limpi") || prompt.includes("modern")) {
        style = "minimalist";
      } else if (prompt.includes("liderazgo") || prompt.includes("leadership")) {
        style = "modern_leadership";
      } else if (prompt.includes("literari") || prompt.includes("elegan")) {
        style = "literary";
      } else if (prompt.includes("devocional") || prompt.includes("pastoral") || prompt.includes("inspirac")) {
        style = "inspirational";
      } else if (prompt.includes("academico") || prompt.includes("estudio")) {
        style = "academic";
      } else if (prompt.includes("narrativ") || prompt.includes("histori") || prompt.includes("testimoni")) {
        style = "narrative";
      }
      rationale = `Estilo "${style}" seleccionado basado en el prompt: "${input.prompt}".`;
      break;
    }
  }

  const stylePreset = getLayoutStylePreset(style) ?? LAYOUT_STYLE_PRESETS[3]; // inspirational default
  const fonts = getFontCombinationForStyle(style);
  const chapterOpener = buildChapterOpenerConfig(stylePreset.chapterOpener);

  return {
    id: `layout_${projectId}_${Date.now()}`,
    designMode: input.mode,
    style: stylePreset,
    fonts,
    chapterOpener,
    frontMatter: DEFAULT_FRONT_MATTER,
    backMatter: DEFAULT_BACK_MATTER,
    designRationale: rationale,
    pagePresetId: "trade_6x9",
    status: "draft",
  };
}

// ─── System Prompt for AI Layout Analysis ───────────────────────────

export function getLayoutDirectorSystemPrompt(): string {
  return `Eres el Director de Diseno Interior de una editorial profesional premium.

RESPONSABILIDAD:
Disenar el interior de libros con calidad profesional de editorial, listos para
distribucion en Amazon KDP, librerias fisicas y plataformas digitales.

FILOSOFIA DE DISENO:
- Premium, elegante, legible, equilibrado
- NO sobrecargado visualmente
- Aunque el libro sea cristiano, NO usar automaticamente imagenes o motivos religiosos decorativos
- El diseno debe parecer publicacion profesional moderna

DECISIONES DE DISENO:
1. Tipografia: selecciona combinacion de fuentes (cuerpo serif + titulos sans-serif, u otras)
2. Jerarquia visual: titulo de capitulo, subtitulos, cuerpo, notas
3. Apertura de capitulo: numero grande, drop cap, elementos sutiles
4. Composicion de pagina: margenes, interlineado, indentacion
5. Front matter: portadilla, portada, copyright, dedicatoria, contenido
6. Back matter: biografia del autor, notas, referencias

FORMATO DE RESPUESTA:
Responde con un JSON estructurado con tus decisiones de diseno.
Incluye una justificacion breve para cada decision.
Responde siempre en espanol.`;
}
