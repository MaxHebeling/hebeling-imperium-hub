import type {
  KdpTrimSize,
  KdpPaperSpec,
  KdpPaperType,
  KdpBindingType,
  KdpBleedOption,
  KdpCoverDimensions,
  KdpFormatConfig,
} from "./types";

// ---------------------------------------------------------------------------
// Amazon KDP Trim Sizes (all dimensions in inches & mm)
// Source: Amazon KDP paperback & hardcover specifications (2024-2025)
// ---------------------------------------------------------------------------

export const KDP_TRIM_SIZES: KdpTrimSize[] = [
  {
    id: "5x8",
    label: '5" x 8" (12.7 x 20.32 cm)',
    widthIn: 5,
    heightIn: 8,
    widthMm: 127,
    heightMm: 203.2,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "5.06x7.81",
    label: '5.06" x 7.81" (12.85 x 19.84 cm)',
    widthIn: 5.06,
    heightIn: 7.81,
    widthMm: 128.5,
    heightMm: 198.4,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "5.25x8",
    label: '5.25" x 8" (13.34 x 20.32 cm)',
    widthIn: 5.25,
    heightIn: 8,
    widthMm: 133.4,
    heightMm: 203.2,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "5.5x8.5",
    label: '5.5" x 8.5" (13.97 x 21.59 cm)',
    widthIn: 5.5,
    heightIn: 8.5,
    widthMm: 139.7,
    heightMm: 215.9,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "6x9",
    label: '6" x 9" (15.24 x 22.86 cm)',
    widthIn: 6,
    heightIn: 9,
    widthMm: 152.4,
    heightMm: 228.6,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "6.14x9.21",
    label: '6.14" x 9.21" (15.6 x 23.39 cm)',
    widthIn: 6.14,
    heightIn: 9.21,
    widthMm: 156,
    heightMm: 233.9,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "6.69x9.61",
    label: '6.69" x 9.61" (16.99 x 24.41 cm)',
    widthIn: 6.69,
    heightIn: 9.61,
    widthMm: 169.9,
    heightMm: 244.1,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "7x10",
    label: '7" x 10" (17.78 x 25.4 cm)',
    widthIn: 7,
    heightIn: 10,
    widthMm: 177.8,
    heightMm: 254,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "7.44x9.69",
    label: '7.44" x 9.69" (18.9 x 24.61 cm)',
    widthIn: 7.44,
    heightIn: 9.69,
    widthMm: 189,
    heightMm: 246.1,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "7.5x9.25",
    label: '7.5" x 9.25" (19.05 x 23.5 cm)',
    widthIn: 7.5,
    heightIn: 9.25,
    widthMm: 190.5,
    heightMm: 235,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "8x10",
    label: '8" x 10" (20.32 x 25.4 cm)',
    widthIn: 8,
    heightIn: 10,
    widthMm: 203.2,
    heightMm: 254,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "8.25x6",
    label: '8.25" x 6" (20.96 x 15.24 cm)',
    widthIn: 8.25,
    heightIn: 6,
    widthMm: 209.6,
    heightMm: 152.4,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "8.25x8.25",
    label: '8.25" x 8.25" (20.96 x 20.96 cm)',
    widthIn: 8.25,
    heightIn: 8.25,
    widthMm: 209.6,
    heightMm: 209.6,
    bindings: ["paperback"],
    bleedAvailable: true,
  },
  {
    id: "8.5x8.5",
    label: '8.5" x 8.5" (21.59 x 21.59 cm)',
    widthIn: 8.5,
    heightIn: 8.5,
    widthMm: 215.9,
    heightMm: 215.9,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
  {
    id: "8.5x11",
    label: '8.5" x 11" (21.59 x 27.94 cm)',
    widthIn: 8.5,
    heightIn: 11,
    widthMm: 215.9,
    heightMm: 279.4,
    bindings: ["paperback", "hardcover"],
    bleedAvailable: true,
  },
];

// ---------------------------------------------------------------------------
// Paper types with PPI (pages per inch) for spine width calculation
// ---------------------------------------------------------------------------

export const KDP_PAPER_SPECS: KdpPaperSpec[] = [
  {
    type: "white",
    label: "Blanco (Estándar)",
    ppi: 444,
    thicknessPerPageIn: 1 / 444,
    minPages: 24,
    maxPages: 828,
    bindings: ["paperback", "hardcover"],
  },
  {
    type: "cream",
    label: "Crema (Estándar)",
    ppi: 434,
    thicknessPerPageIn: 1 / 434,
    minPages: 24,
    maxPages: 828,
    bindings: ["paperback", "hardcover"],
  },
  {
    type: "color_standard",
    label: "Color Estándar",
    ppi: 444,
    thicknessPerPageIn: 1 / 444,
    minPages: 24,
    maxPages: 480,
    bindings: ["paperback"],
  },
  {
    type: "color_premium",
    label: "Color Premium",
    ppi: 400,
    thicknessPerPageIn: 1 / 400,
    minPages: 24,
    maxPages: 480,
    bindings: ["paperback", "hardcover"],
  },
];

// ---------------------------------------------------------------------------
// Labels for UI
// ---------------------------------------------------------------------------

export const KDP_PAPER_LABELS: Record<KdpPaperType, string> = {
  white: "Blanco (Estándar)",
  cream: "Crema (Estándar)",
  color_standard: "Color Estándar",
  color_premium: "Color Premium",
};

export const KDP_BINDING_LABELS: Record<KdpBindingType, string> = {
  paperback: "Tapa blanda (Paperback)",
  hardcover: "Tapa dura (Hardcover)",
};

export const KDP_BLEED_LABELS: Record<KdpBleedOption, string> = {
  no_bleed: "Sin sangrado",
  bleed: "Con sangrado (0.125″ / 3.2 mm)",
};

// ---------------------------------------------------------------------------
// Bleed constants (in inches)
// ---------------------------------------------------------------------------

/** Standard bleed on all sides when bleed is enabled */
const BLEED_IN = 0.125;

/** Hardcover wrap bleed (extra for the case wrap) */
const HARDCOVER_WRAP_IN = 0.625;

// ---------------------------------------------------------------------------
// Cover dimension calculator
// ---------------------------------------------------------------------------

/**
 * Calculates the full cover dimensions for an Amazon KDP book.
 *
 * Formula:
 *   Spine width = pageCount / PPI
 *   Full width  = bleed + backCover + spine + frontCover + bleed
 *   Full height = bleed + trimHeight + bleed
 *
 * For hardcover, extra wrap is added instead of standard bleed.
 */
export function calculateKdpCoverDimensions(config: KdpFormatConfig): KdpCoverDimensions | { error: string } {
  const trimSize = KDP_TRIM_SIZES.find((t) => t.id === config.trimSizeId);
  if (!trimSize) {
    return { error: `Tamaño de corte no encontrado: ${config.trimSizeId}` };
  }

  const paperSpec = KDP_PAPER_SPECS.find((p) => p.type === config.paperType);
  if (!paperSpec) {
    return { error: `Tipo de papel no encontrado: ${config.paperType}` };
  }

  if (!trimSize.bindings.includes(config.binding)) {
    return { error: `El tamaño ${trimSize.label} no soporta ${KDP_BINDING_LABELS[config.binding]}` };
  }

  if (!paperSpec.bindings.includes(config.binding)) {
    return { error: `El papel ${paperSpec.label} no soporta ${KDP_BINDING_LABELS[config.binding]}` };
  }

  if (config.pageCount < paperSpec.minPages) {
    return { error: `Mínimo ${paperSpec.minPages} páginas para ${paperSpec.label}` };
  }

  if (config.pageCount > paperSpec.maxPages) {
    return { error: `Máximo ${paperSpec.maxPages} páginas para ${paperSpec.label}` };
  }

  if (config.pageCount % 2 !== 0) {
    return { error: "El número de páginas debe ser par" };
  }

  // Calculate spine width
  const spineWidthIn = config.pageCount / paperSpec.ppi;

  // Determine bleed amount
  let bleedIn: number;
  if (config.binding === "hardcover") {
    bleedIn = HARDCOVER_WRAP_IN;
  } else {
    bleedIn = config.bleed === "bleed" ? BLEED_IN : 0;
  }

  // Full cover dimensions
  const fullWidthIn = bleedIn + trimSize.widthIn + spineWidthIn + trimSize.widthIn + bleedIn;
  const fullHeightIn = bleedIn + trimSize.heightIn + bleedIn;

  // Convert to mm (1 inch = 25.4 mm)
  const fullWidthMm = fullWidthIn * 25.4;
  const fullHeightMm = fullHeightIn * 25.4;
  const spineWidthMm = spineWidthIn * 25.4;

  // Convert to pixels at 300 DPI
  const fullWidthPx = Math.round(fullWidthIn * 300);
  const fullHeightPx = Math.round(fullHeightIn * 300);

  return {
    fullWidthIn: Math.round(fullWidthIn * 10000) / 10000,
    fullHeightIn: Math.round(fullHeightIn * 10000) / 10000,
    fullWidthMm: Math.round(fullWidthMm * 100) / 100,
    fullHeightMm: Math.round(fullHeightMm * 100) / 100,
    spineWidthIn: Math.round(spineWidthIn * 10000) / 10000,
    spineWidthMm: Math.round(spineWidthMm * 100) / 100,
    bleedIn,
    fullWidthPx,
    fullHeightPx,
    spineTextRecommended: spineWidthIn >= 0.5,
    trimSize,
    paperType: config.paperType,
    pageCount: config.pageCount,
    binding: config.binding,
    bleed: config.bleed,
  };
}

/**
 * Returns the minimum interior margins (in inches) based on trim size and page count.
 * Amazon KDP requires larger gutter margins for thicker books.
 */
export function getKdpMinimumMargins(pageCount: number, hasBleed: boolean) {
  const gutterBase = pageCount <= 150 ? 0.375 : pageCount <= 400 ? 0.5 : pageCount <= 600 ? 0.625 : 0.75;

  if (hasBleed) {
    return {
      top: 0.25,
      bottom: 0.25,
      outside: 0.25,
      gutter: gutterBase,
    };
  }

  return {
    top: 0.25,
    bottom: 0.25,
    outside: 0.25,
    gutter: gutterBase,
  };
}
