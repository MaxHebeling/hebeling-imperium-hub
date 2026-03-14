import type { ExportConfig, BookPageSize } from "./types";

/**
 * Professional book format presets for editorial production.
 *
 * Each preset includes page dimensions, margins, typography, and
 * production settings optimized for a specific output format.
 *
 * Margin values are in mm. Font sizes in pt.
 */

export interface BookFormatPreset {
  id: string;
  name: string;
  description: string;
  /** Page size key */
  pageSize: BookPageSize;
  /** Page width in PDF points (1pt = 1/72 inch) */
  widthPt: number;
  /** Page height in PDF points */
  heightPt: number;
  /** Recommended margins in mm */
  margins: {
    top: number;
    bottom: number;
    /** Interior / gutter margin — closer to spine */
    interior: number;
    /** Exterior / outside margin */
    exterior: number;
  };
  /** Typography settings */
  typography: {
    bodyFont: string;
    bodySize: number;
    lineHeight: number;
    headingFont: string;
    headingSize: number;
    paragraphIndent: number;
  };
  /** Paper recommendation */
  paperType: "white" | "cream";
  /** KDP compatible */
  kdpCompatible: boolean;
  /** IngramSpark compatible */
  ingramCompatible: boolean;
  /** Best for these genres */
  recommendedFor: string[];
}

/**
 * Convert inches to PDF points (1 inch = 72 points)
 */
function inToPt(inches: number): number {
  return inches * 72;
}

export const BOOK_FORMAT_PRESETS: BookFormatPreset[] = [
  // ─── Trade Paperback 6x9 (Most Popular) ──────────────────────────
  {
    id: "trade_6x9",
    name: 'Trade Paperback 6" x 9"',
    description:
      "El formato mas popular para ficcion y no-ficcion. Estandar de la industria editorial.",
    pageSize: "trade_6x9",
    widthPt: inToPt(6),
    heightPt: inToPt(9),
    margins: {
      top: 19,       // 0.75"
      bottom: 19,    // 0.75"
      interior: 22,  // 0.875" (gutter)
      exterior: 16,  // 0.625"
    },
    typography: {
      bodyFont: "Helvetica",
      bodySize: 11,
      lineHeight: 1.5,
      headingFont: "Helvetica-Bold",
      headingSize: 22,
      paragraphIndent: 7,
    },
    paperType: "cream",
    kdpCompatible: true,
    ingramCompatible: true,
    recommendedFor: [
      "Ficcion general",
      "No-ficcion",
      "Memorias",
      "Devocionales",
      "Estudios biblicos",
    ],
  },

  // ─── Compact 5.5x8.5 ─────────────────────────────────────────────
  {
    id: "compact_5.5x8.5",
    name: 'Compacto 5.5" x 8.5"',
    description:
      "Formato compacto ideal para devocionales, libros de oracion y lectura rapida.",
    pageSize: "trade_5.5x8.5",
    widthPt: inToPt(5.5),
    heightPt: inToPt(8.5),
    margins: {
      top: 17,       // ~0.67"
      bottom: 17,    // ~0.67"
      interior: 20,  // ~0.79"
      exterior: 14,  // ~0.55"
    },
    typography: {
      bodyFont: "Helvetica",
      bodySize: 10.5,
      lineHeight: 1.45,
      headingFont: "Helvetica-Bold",
      headingSize: 20,
      paragraphIndent: 6,
    },
    paperType: "cream",
    kdpCompatible: true,
    ingramCompatible: true,
    recommendedFor: [
      "Devocionales",
      "Libros de oracion",
      "Guias de estudio",
      "Libros compactos",
    ],
  },

  // ─── Pocket 5x8 ──────────────────────────────────────────────────
  {
    id: "pocket_5x8",
    name: 'Bolsillo 5" x 8"',
    description:
      "Formato de bolsillo, portatil y economico. Ideal para novelas y lecturas ligeras.",
    pageSize: "pocket_5x8",
    widthPt: inToPt(5),
    heightPt: inToPt(8),
    margins: {
      top: 16,       // ~0.63"
      bottom: 16,    // ~0.63"
      interior: 19,  // ~0.75"
      exterior: 13,  // ~0.5"
    },
    typography: {
      bodyFont: "Helvetica",
      bodySize: 10,
      lineHeight: 1.4,
      headingFont: "Helvetica-Bold",
      headingSize: 18,
      paragraphIndent: 5,
    },
    paperType: "white",
    kdpCompatible: true,
    ingramCompatible: true,
    recommendedFor: [
      "Novelas",
      "Ficcion ligera",
      "Lecturas rapidas",
      "Libros de bolsillo",
    ],
  },

  // ─── Professional 8.5x11 (Large Format) ──────────────────────────
  {
    id: "professional_8.5x11",
    name: 'Profesional 8.5" x 11"',
    description:
      "Formato grande para manuales, libros de trabajo y contenido con tablas o graficos.",
    pageSize: "a4",
    widthPt: inToPt(8.5),
    heightPt: inToPt(11),
    margins: {
      top: 25,       // ~1"
      bottom: 25,    // ~1"
      interior: 25,  // ~1"
      exterior: 20,  // ~0.79"
    },
    typography: {
      bodyFont: "Helvetica",
      bodySize: 12,
      lineHeight: 1.5,
      headingFont: "Helvetica-Bold",
      headingSize: 24,
      paragraphIndent: 10,
    },
    paperType: "white",
    kdpCompatible: true,
    ingramCompatible: true,
    recommendedFor: [
      "Manuales",
      "Libros de trabajo",
      "Material educativo",
      "Libros con graficos",
    ],
  },

  // ─── A5 International ────────────────────────────────────────────
  {
    id: "a5_international",
    name: "A5 Internacional (148 x 210 mm)",
    description:
      "Formato internacional estandar. Usado ampliamente en Europa y America Latina.",
    pageSize: "a5",
    widthPt: 419.53, // A5 width in points
    heightPt: 595.28, // A5 height in points
    margins: {
      top: 18,
      bottom: 18,
      interior: 20,
      exterior: 15,
    },
    typography: {
      bodyFont: "Helvetica",
      bodySize: 10.5,
      lineHeight: 1.45,
      headingFont: "Helvetica-Bold",
      headingSize: 20,
      paragraphIndent: 6,
    },
    paperType: "cream",
    kdpCompatible: false,
    ingramCompatible: true,
    recommendedFor: [
      "Mercado latinoamericano",
      "Distribucion internacional",
      "Ensayos",
    ],
  },
];

/**
 * Get a preset by ID.
 */
export function getBookFormatPreset(
  presetId: string
): BookFormatPreset | undefined {
  return BOOK_FORMAT_PRESETS.find((p) => p.id === presetId);
}

/**
 * Convert a book format preset into an ExportConfig.
 */
export function presetToExportConfig(
  preset: BookFormatPreset,
  overrides?: Partial<ExportConfig>
): ExportConfig {
  return {
    format: "pdf",
    quality: "print",
    includeMetadata: true,
    includeCover: true,
    includeTableOfContents: true,
    pageSize: preset.pageSize,
    margins: {
      top: preset.margins.top,
      bottom: preset.margins.bottom,
      left: preset.margins.interior,
      right: preset.margins.exterior,
    },
    fontFamily: preset.typography.bodyFont,
    fontSize: preset.typography.bodySize,
    lineHeight: preset.typography.lineHeight,
    paragraphIndent: preset.typography.paragraphIndent,
    chapterStartRecto: true,
    runningHeaders: true,
    paperType: preset.paperType,
    ...overrides,
  };
}

/**
 * Get recommended presets for a genre.
 */
export function getPresetsForGenre(genre: string): BookFormatPreset[] {
  const lower = genre.toLowerCase();
  return BOOK_FORMAT_PRESETS.filter((p) =>
    p.recommendedFor.some((r) => r.toLowerCase().includes(lower))
  );
}
