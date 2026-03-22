export const REINO_EDITORIAL_TYPOGRAPHY_PRESETS = [
  {
    value: "classic_serif",
    label: "Clasico serif",
    description:
      "Cuerpo serif tradicional y muy legible para narrativa, ensayo y devocionales.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Times-Italic",
  },
  {
    value: "modern_clean",
    label: "Moderno limpio",
    description:
      "Interior contemporaneo, claro y sobrio para liderazgo y no ficcion.",
    bodyFont: "Helvetica",
    headingFont: "Helvetica-Bold",
    accentFont: "Helvetica-Oblique",
  },
  {
    value: "elegant_traditional",
    label: "Elegante tradicional",
    description:
      "Acabado editorial clasico para textos formales, inspiracionales y premium.",
    bodyFont: "Times-Roman",
    headingFont: "Times-Bold",
    accentFont: "Times-Italic",
  },
  {
    value: "contemporary_mix",
    label: "Contemporaneo mixto",
    description:
      "Combina cuerpo serif con titulos sans serif para una jerarquia moderna.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Helvetica-Oblique",
  },
  {
    value: "academic_formal",
    label: "Academico formal",
    description:
      "Preset sobrio para estudios, referencia, manuales y contenidos tecnicos.",
    bodyFont: "Times-Roman",
    headingFont: "Helvetica-Bold",
    accentFont: "Courier",
  },
] as const;

export type ReinoEditorialTypographyPresetId =
  (typeof REINO_EDITORIAL_TYPOGRAPHY_PRESETS)[number]["value"];

export const REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID: ReinoEditorialTypographyPresetId =
  "classic_serif";

export const REINO_EDITORIAL_TYPOGRAPHY_PRESET_OPTIONS =
  REINO_EDITORIAL_TYPOGRAPHY_PRESETS.map((preset) => ({
    value: preset.value,
    label: preset.label,
    description: preset.description,
  }));

export const REINO_EDITORIAL_FONT_SIZE_OPTIONS = [
  10.5,
  11,
  11.5,
  12,
] as const;

export function isReinoEditorialTypographyPresetId(
  value: string | null | undefined
): value is ReinoEditorialTypographyPresetId {
  if (!value) {
    return false;
  }

  return REINO_EDITORIAL_TYPOGRAPHY_PRESETS.some(
    (preset) => preset.value === value
  );
}

export function resolveReinoEditorialTypographyPresetId(
  value: string | null | undefined
): ReinoEditorialTypographyPresetId {
  if (isReinoEditorialTypographyPresetId(value)) {
    return value;
  }

  return REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID;
}

export function getReinoEditorialTypographyPreset(
  value: string | null | undefined
) {
  const resolvedId = resolveReinoEditorialTypographyPresetId(value);

  return (
    REINO_EDITORIAL_TYPOGRAPHY_PRESETS.find(
      (preset) => preset.value === resolvedId
    ) ?? REINO_EDITORIAL_TYPOGRAPHY_PRESETS[0]
  );
}

export function getReinoEditorialDefaultFontSize(
  trimSizeId: string | null | undefined
): number {
  if (trimSizeId === "5.5x8.5" || trimSizeId === "5x8" || trimSizeId === "5.25x8") {
    return 10.5;
  }

  if (trimSizeId === "8.5x11") {
    return 12;
  }

  return 11;
}

export function getReinoEditorialDefaultLineSpacing(): number {
  return 1.15;
}
