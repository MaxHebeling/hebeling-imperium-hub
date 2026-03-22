/**
 * AI Cover Art Director — Professional Book Cover System
 *
 * Generates professional book covers suitable for:
 * - Amazon KDP print
 * - Online bookstores
 * - Printed distribution
 *
 * Supports three design decision modes:
 * 1. Editorial Prompt — editorial team defines design direction
 * 2. Author Prompt — client provides a concept prompt
 * 3. AI Decision — AI analyzes manuscript and proposes cover concept
 */

// ─── Cover Design Decision Modes ────────────────────────────────────

export type CoverDesignMode = "editorial_prompt" | "author_prompt" | "ai_decision";

export interface CoverDesignInput {
  mode: CoverDesignMode;
  /** Design prompt from staff or author (modes 1 & 2) */
  prompt?: string;
  /** Manuscript analysis data for AI decision (mode 3) */
  manuscriptAnalysis?: {
    genre: string;
    tone: string;
    audience: string;
    themes: string[];
    language: string;
  };
}

// ─── Cover Content ──────────────────────────────────────────────────

export interface CoverContent {
  /** Book title (main) */
  title: string;
  /** Book subtitle (optional) */
  subtitle?: string;
  /** Author name */
  authorName: string;
  /** Back cover description / synopsis */
  backCoverText: string;
  /** Endorsements / blurbs */
  endorsements?: CoverEndorsement[];
  /** Publisher logo identifier */
  publisherLogo?: string;
  /** ISBN for barcode */
  isbn?: string;
  /** Author bio for back cover */
  authorBio?: string;
  /** Series name if part of a series */
  seriesName?: string;
  /** Series number */
  seriesNumber?: number;
}

export interface CoverEndorsement {
  quote: string;
  author: string;
  title?: string;
}

// ─── Cover Style System ─────────────────────────────────────────────

export type CoverStyle =
  | "minimalist"
  | "modern_leadership"
  | "literary"
  | "inspirational"
  | "academic"
  | "narrative";

export interface CoverStyleConfig {
  id: CoverStyle;
  name: string;
  description: string;
  /** Title typography weight/style */
  titleStyle: "bold" | "elegant" | "minimal" | "condensed";
  /** Primary color scheme type */
  colorScheme: "monochrome" | "warm" | "cool" | "earth" | "vibrant";
  /** Image/illustration usage */
  imageApproach: "photography" | "illustration" | "abstract" | "typography_only" | "symbolic";
  /** Layout composition */
  composition: "centered" | "asymmetric" | "full_bleed" | "framed" | "split";
  /** Recommended genres */
  recommendedFor: string[];
}

export const COVER_STYLE_PRESETS: CoverStyleConfig[] = [
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Diseno limpio con enfasis en tipografia. Colores solidos o degradados sutiles.",
    titleStyle: "minimal",
    colorScheme: "monochrome",
    imageApproach: "typography_only",
    composition: "centered",
    recommendedFor: ["liderazgo", "negocios", "autoayuda", "productividad"],
  },
  {
    id: "modern_leadership",
    name: "Liderazgo Moderno",
    description: "Tipografia fuerte con imagen simbolica. Profesional y contundente.",
    titleStyle: "bold",
    colorScheme: "cool",
    imageApproach: "symbolic",
    composition: "asymmetric",
    recommendedFor: ["liderazgo", "emprendimiento", "mentoria", "negocios"],
  },
  {
    id: "literary",
    name: "Literario",
    description: "Elegante y sofisticado. Composicion clasica con tipografia refinada.",
    titleStyle: "elegant",
    colorScheme: "earth",
    imageApproach: "photography",
    composition: "framed",
    recommendedFor: ["ficcion", "memorias", "poesia", "ensayo"],
  },
  {
    id: "inspirational",
    name: "Inspiracional",
    description: "Calido y acogedor. Imagenes simbolicas de esperanza, luz, naturaleza.",
    titleStyle: "elegant",
    colorScheme: "warm",
    imageApproach: "symbolic",
    composition: "full_bleed",
    recommendedFor: ["devocional", "oracion", "fe", "pastoral", "inspiracional"],
  },
  {
    id: "academic",
    name: "Academico",
    description: "Estructurado y formal. Predominio de tipografia sobre imagen.",
    titleStyle: "condensed",
    colorScheme: "monochrome",
    imageApproach: "abstract",
    composition: "centered",
    recommendedFor: ["estudio biblico", "teologia", "manual", "referencia"],
  },
  {
    id: "narrative",
    name: "Narrativo",
    description: "Evocador y emocional. Uso de fotografia o ilustracion que sugiera la historia.",
    titleStyle: "bold",
    colorScheme: "vibrant",
    imageApproach: "photography",
    composition: "split",
    recommendedFor: ["testimonio", "cronica", "biografia", "historia"],
  },
];

// ─── Amazon KDP Cover Specifications ────────────────────────────────

export interface KDPCoverSpecs {
  /** Trim size in inches [width, height] */
  trimSize: [number, number];
  /** Bleed in inches (typically 0.125") */
  bleed: number;
  /** Spine width in inches (calculated from page count) */
  spineWidth: number;
  /** Total cover width in inches (front + spine + back + bleeds) */
  totalWidth: number;
  /** Total cover height in inches (trim height + bleeds) */
  totalHeight: number;
  /** Resolution in DPI */
  dpi: number;
  /** Total pixel dimensions */
  pixelWidth: number;
  pixelHeight: number;
  /** Paper type */
  paperType: "white" | "cream";
}

/**
 * Calculate spine width based on page count and paper type.
 *
 * Amazon KDP formula:
 * - White paper: spine = page_count * 0.002252"
 * - Cream paper: spine = page_count * 0.0025"
 */
export function calculateSpineWidth(
  pageCount: number,
  paperType: "white" | "cream" = "cream"
): number {
  const factor = paperType === "white" ? 0.002252 : 0.0025;
  return Math.round(pageCount * factor * 10000) / 10000;
}

/**
 * Calculate complete KDP cover specifications.
 */
export function calculateKDPCoverSpecs(
  trimWidth: number,
  trimHeight: number,
  pageCount: number,
  paperType: "white" | "cream" = "cream",
  dpi: number = 300
): KDPCoverSpecs {
  const bleed = 0.125;
  const spineWidth = calculateSpineWidth(pageCount, paperType);

  // Total dimensions including bleeds
  const totalWidth = bleed + trimWidth + spineWidth + trimWidth + bleed;
  const totalHeight = bleed + trimHeight + bleed;

  return {
    trimSize: [trimWidth, trimHeight],
    bleed,
    spineWidth,
    totalWidth,
    totalHeight,
    dpi,
    pixelWidth: Math.ceil(totalWidth * dpi),
    pixelHeight: Math.ceil(totalHeight * dpi),
    paperType,
  };
}

// ─── Cover Zones (for element positioning) ──────────────────────────

export interface CoverZones {
  /** Front cover area (in inches from left edge) */
  frontCover: { x: number; y: number; width: number; height: number };
  /** Spine area */
  spine: { x: number; y: number; width: number; height: number };
  /** Back cover area */
  backCover: { x: number; y: number; width: number; height: number };
  /** ISBN barcode zone on back cover (bottom right) */
  barcodeZone: { x: number; y: number; width: number; height: number };
  /** Safe zones (inside margins for each section) */
  safeMargin: number;
}

/**
 * Calculate cover zones for element positioning.
 */
export function calculateCoverZones(specs: KDPCoverSpecs): CoverZones {
  const { bleed, trimSize, spineWidth } = specs;
  const safeMargin = 0.25; // 0.25" safe margin inside trim

  return {
    backCover: {
      x: bleed,
      y: bleed,
      width: trimSize[0],
      height: trimSize[1],
    },
    spine: {
      x: bleed + trimSize[0],
      y: bleed,
      width: spineWidth,
      height: trimSize[1],
    },
    frontCover: {
      x: bleed + trimSize[0] + spineWidth,
      y: bleed,
      width: trimSize[0],
      height: trimSize[1],
    },
    barcodeZone: {
      x: bleed + safeMargin + (trimSize[0] - 2.375) / 2,
      y: bleed + trimSize[1] - 1.5 - safeMargin,
      width: 2.375,
      height: 1.5,
    },
    safeMargin,
  };
}

// ─── Cover Concept ──────────────────────────────────────────────────

export interface CoverConcept {
  /** Unique ID */
  id: string;
  /** How design was generated */
  designMode: CoverDesignMode;
  /** Selected style */
  style: CoverStyleConfig;
  /** Cover content */
  content: CoverContent;
  /** KDP specs */
  kdpSpecs: KDPCoverSpecs;
  /** Cover zones for element positioning */
  zones: CoverZones;
  /** AI-generated design description */
  designDescription: string;
  /** Color palette suggestion (hex codes) */
  colorPalette: string[];
  /** Suggested typography */
  typography: {
    titleFont: string;
    subtitleFont: string;
    authorFont: string;
    bodyFont: string;
  };
  /** Approval status */
  status: "draft" | "approved" | "rejected" | "revision_requested";
  /** Staff notes / feedback */
  staffNotes?: string;
}

// ─── Cover Style Intelligence ───────────────────────────────────────

/** Genre to cover style mapping */
const GENRE_COVER_STYLE_MAP: Record<string, CoverStyle> = {
  ficcion: "literary",
  novela: "narrative",
  narrativa: "narrative",
  memorias: "literary",
  biografia: "narrative",
  liderazgo: "modern_leadership",
  negocios: "modern_leadership",
  emprendimiento: "modern_leadership",
  autoayuda: "minimalist",
  productividad: "minimalist",
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
 * Infer cover style based on manuscript analysis.
 */
export function inferCoverStyle(analysis: {
  genre: string;
  tone: string;
  audience: string;
  themes: string[];
}): CoverStyle {
  const genreLower = analysis.genre.toLowerCase().replace(/\s+/g, "_");

  // Direct genre match
  if (GENRE_COVER_STYLE_MAP[genreLower]) {
    return GENRE_COVER_STYLE_MAP[genreLower];
  }

  // Partial match
  for (const [key, style] of Object.entries(GENRE_COVER_STYLE_MAP)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      return style;
    }
  }

  // Theme-based inference
  const themeStr = analysis.themes.join(" ").toLowerCase();
  if (themeStr.includes("fe") || themeStr.includes("dios") || themeStr.includes("espiritual")) {
    return "inspirational";
  }
  if (themeStr.includes("lider") || themeStr.includes("empresa") || themeStr.includes("negocio")) {
    return "modern_leadership";
  }

  // Tone-based fallback
  const toneLower = analysis.tone.toLowerCase();
  if (toneLower.includes("pastoral") || toneLower.includes("devocional")) {
    return "inspirational";
  }
  if (toneLower.includes("formal") || toneLower.includes("academico")) {
    return "academic";
  }

  return "inspirational";
}

/**
 * Get cover style preset by ID.
 */
export function getCoverStylePreset(styleId: CoverStyle): CoverStyleConfig | undefined {
  return COVER_STYLE_PRESETS.find((s) => s.id === styleId);
}

/**
 * Generate a complete cover concept based on design input.
 */
export function generateCoverConcept(
  input: CoverDesignInput,
  content: CoverContent,
  pageCount: number,
  trimSize: [number, number] = [6, 9],
  paperType: "white" | "cream" = "cream"
): CoverConcept {
  let style: CoverStyle = "inspirational";
  let designDescription = "";

  switch (input.mode) {
    case "ai_decision": {
      if (input.manuscriptAnalysis) {
        style = inferCoverStyle(input.manuscriptAnalysis);
        designDescription = `Estilo "${style}" seleccionado automaticamente. Genero: "${input.manuscriptAnalysis.genre}", tono: "${input.manuscriptAnalysis.tone}", audiencia: "${input.manuscriptAnalysis.audience}". Temas: ${input.manuscriptAnalysis.themes.join(", ")}.`;
      }
      break;
    }
    case "editorial_prompt":
    case "author_prompt": {
      const prompt = (input.prompt ?? "").toLowerCase();
      if (prompt.includes("minimal") || prompt.includes("limpi") || prompt.includes("simple")) {
        style = "minimalist";
      } else if (prompt.includes("liderazgo") || prompt.includes("leadership") || prompt.includes("profesional")) {
        style = "modern_leadership";
      } else if (prompt.includes("literari") || prompt.includes("elegan") || prompt.includes("clasic")) {
        style = "literary";
      } else if (prompt.includes("devocional") || prompt.includes("pastoral") || prompt.includes("inspirac") || prompt.includes("esperanza")) {
        style = "inspirational";
      } else if (prompt.includes("academico") || prompt.includes("estudio") || prompt.includes("formal")) {
        style = "academic";
      } else if (prompt.includes("narrativ") || prompt.includes("histori") || prompt.includes("testimoni")) {
        style = "narrative";
      }
      designDescription = `Concepto basado en el prompt del ${input.mode === "editorial_prompt" ? "equipo editorial" : "autor"}: "${input.prompt}". Estilo "${style}" aplicado.`;
      break;
    }
  }

  const stylePreset = getCoverStylePreset(style) ?? COVER_STYLE_PRESETS[3];
  const kdpSpecs = calculateKDPCoverSpecs(trimSize[0], trimSize[1], pageCount, paperType);
  const zones = calculateCoverZones(kdpSpecs);

  // Generate color palette based on style
  const colorPalette = generateColorPalette(stylePreset);

  return {
    id: `cover_${Date.now()}`,
    designMode: input.mode,
    style: stylePreset,
    content,
    kdpSpecs,
    zones,
    designDescription,
    colorPalette,
    typography: {
      titleFont: "Helvetica-Bold",
      subtitleFont: "Helvetica",
      authorFont: "Helvetica",
      bodyFont: "Times-Roman",
    },
    status: "draft",
  };
}

/**
 * Generate a color palette suggestion based on cover style.
 */
function generateColorPalette(style: CoverStyleConfig): string[] {
  switch (style.colorScheme) {
    case "monochrome":
      return ["#1A1A2E", "#16213E", "#0F3460", "#E5E5E5", "#FFFFFF"];
    case "warm":
      return ["#8B4513", "#D2691E", "#F4A460", "#FFECD2", "#FFFFFF"];
    case "cool":
      return ["#1B2838", "#2D4059", "#3D6B8E", "#D4E6F1", "#FFFFFF"];
    case "earth":
      return ["#3E2723", "#5D4037", "#8D6E63", "#D7CCC8", "#EFEBE9"];
    case "vibrant":
      return ["#1A237E", "#283593", "#5C6BC0", "#E8EAF6", "#FFFFFF"];
    default:
      return ["#212121", "#424242", "#757575", "#E0E0E0", "#FFFFFF"];
  }
}

// ─── System Prompt for AI Cover Analysis ────────────────────────────

export function getCoverDirectorSystemPrompt(): string {
  return `Eres el Director de Arte de Portada de una editorial profesional premium.

RESPONSABILIDAD:
Disenar portadas de libros con calidad profesional de editorial, listas para
distribucion en Amazon KDP, librerias fisicas y plataformas digitales.

PRINCIPIOS DE DISENO:
- Tipografia fuerte y legible
- Claridad visual
- Composicion equilibrada
- Imagenes simbolicas (NO cliches religiosos)
- Estetica moderna y profesional
- EVITAR: imagenes genericas de IA, disenos sobrecargados, estilo amateur

ESTRUCTURA DE PORTADA:
- Portada frontal: titulo, subtitulo, nombre del autor, imagen/diseno
- Lomo: titulo, nombre del autor, logo editorial
- Contraportada: sinopsis, endorsements, ISBN, biografia del autor

ESPECIFICACIONES TECNICAS:
- Seguir especificaciones Amazon KDP
- Resolucion minima 300 DPI
- Bleed de 0.125"
- Zona segura de 0.25" desde el borde de corte

FORMATO DE RESPUESTA:
Responde con un JSON estructurado con tu concepto de diseno.
Incluye descripcion detallada del concepto visual.
Responde siempre en espanol.`;
}

// ─── Cover Review System ────────────────────────────────────────────

export interface CoverReviewAction {
  type: "approve" | "reject" | "request_revision" | "regenerate";
  feedback?: string;
  /** Updated prompt for regeneration */
  newPrompt?: string;
  /** Alternative image to use (uploaded by staff) */
  alternativeImageUrl?: string;
  /** Typography adjustments */
  typographyAdjustments?: {
    titleFont?: string;
    subtitleFont?: string;
    authorFont?: string;
    titleSize?: "larger" | "smaller";
    colorAdjustment?: string;
  };
}

/**
 * Apply a review action to a cover concept.
 */
export function applyCoverReviewAction(
  concept: CoverConcept,
  action: CoverReviewAction
): CoverConcept {
  const updated = { ...concept };

  switch (action.type) {
    case "approve":
      updated.status = "approved";
      updated.staffNotes = action.feedback ?? "Aprobado por el equipo editorial.";
      break;
    case "reject":
      updated.status = "rejected";
      updated.staffNotes = action.feedback ?? "Rechazado. Se requiere un nuevo concepto.";
      break;
    case "request_revision":
      updated.status = "revision_requested";
      updated.staffNotes = action.feedback ?? "Se solicitan ajustes.";
      break;
    case "regenerate":
      updated.status = "draft";
      updated.staffNotes = action.feedback ?? "Regenerando con nuevo prompt.";
      break;
  }

  // Apply typography adjustments if provided
  if (action.typographyAdjustments) {
    updated.typography = {
      ...updated.typography,
      ...(action.typographyAdjustments.titleFont && { titleFont: action.typographyAdjustments.titleFont }),
      ...(action.typographyAdjustments.subtitleFont && { subtitleFont: action.typographyAdjustments.subtitleFont }),
      ...(action.typographyAdjustments.authorFont && { authorFont: action.typographyAdjustments.authorFont }),
    };
  }

  return updated;
}

// ─── Cover Export ───────────────────────────────────────────────────

export type CoverExportType =
  | "kdp_full_wrap_pdf"    // Full wrap for KDP print (front + spine + back)
  | "front_cover_image"    // Front cover only (for ebook, marketing)
  | "marketing_preview";   // 3D mockup or presentation image

export interface CoverExportConfig {
  type: CoverExportType;
  /** DPI for export */
  dpi: number;
  /** Output format */
  format: "pdf" | "png" | "jpg";
  /** Quality (for jpg) */
  quality?: number;
}

export const COVER_EXPORT_PRESETS: Record<CoverExportType, CoverExportConfig> = {
  kdp_full_wrap_pdf: {
    type: "kdp_full_wrap_pdf",
    dpi: 300,
    format: "pdf",
  },
  front_cover_image: {
    type: "front_cover_image",
    dpi: 300,
    format: "png",
  },
  marketing_preview: {
    type: "marketing_preview",
    dpi: 150,
    format: "jpg",
    quality: 90,
  },
};
