import { getKdpMinimumMargins, KDP_TRIM_SIZES } from "./constants";
import {
  getReinoEditorialDefaultFontSize,
  getReinoEditorialDefaultLineSpacing,
} from "./typography";

export const REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS = [
  "6x9",
  "5.5x8.5",
] as const;

export type ReinoEditorialCollectionTrimSizeId =
  (typeof REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS)[number];

export const REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID: ReinoEditorialCollectionTrimSizeId =
  "6x9";

export const REINO_EDITORIAL_COLLECTION_TRIM_SIZE_OPTIONS = [
  {
    value: "6x9",
    label: '6" x 9" (Estándar editorial Amazon KDP)',
  },
  {
    value: "5.5x8.5",
    label: '5.5" x 8.5" (Compacto editorial Amazon KDP)',
  },
] as const;

export function isReinoEditorialCollectionTrimSizeId(
  value: string | null | undefined
): value is ReinoEditorialCollectionTrimSizeId {
  if (!value) {
    return false;
  }

  return REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS.includes(
    value as ReinoEditorialCollectionTrimSizeId
  );
}

export function resolveReinoEditorialCollectionTrimSizeId(
  value: string | null | undefined
): ReinoEditorialCollectionTrimSizeId {
  if (isReinoEditorialCollectionTrimSizeId(value)) {
    return value;
  }

  return REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID;
}

export function getReinoEditorialTrimSizeLabel(trimSizeId: string): string {
  return (
    KDP_TRIM_SIZES.find((item) => item.id === trimSizeId)?.label ??
    trimSizeId
  );
}

export function getReinoEditorialLayoutPresetId(
  trimSizeId: string
): string {
  if (trimSizeId === "5.5x8.5") return "compact_5.5x8.5";
  if (trimSizeId === "6x9") return "trade_6x9";
  if (trimSizeId === "5x8") return "pocket_5x8";
  if (trimSizeId === "8.5x11") return "professional_8.5x11";
  return `kdp_trim:${trimSizeId}`;
}

export function isSupportedKdpTrimSizeId(
  value: string | null | undefined
): value is string {
  if (!value) {
    return false;
  }

  return KDP_TRIM_SIZES.some((item) => item.id === value);
}

export function isReinoEditorialSpecialKdpTrimSizeId(
  value: string | null | undefined
): boolean {
  return isSupportedKdpTrimSizeId(value) && !isReinoEditorialCollectionTrimSizeId(value);
}

export interface ReinoEditorialBookSpecsSeed {
  trim_size_id: string;
  print_type: "black_and_white" | "standard_color" | "premium_color";
  paper_type: "white" | "cream" | "color_standard" | "color_premium";
  binding: "paperback" | "hardcover";
  bleed: "no_bleed" | "bleed";
  font_size: number;
  line_spacing: number;
  margin_top: number;
  margin_bottom: number;
  margin_inner: number;
  margin_outer: number;
  layout_template: string;
}

export function buildEditorialBookSpecsSeed(
  trimSizeIdInput: string | null | undefined,
  options?: {
    pageCount?: number;
    printType?: "black_and_white" | "standard_color" | "premium_color";
    paperType?: "white" | "cream" | "color_standard" | "color_premium";
    binding?: "paperback" | "hardcover";
    bleed?: "no_bleed" | "bleed";
    fontSize?: number;
    lineSpacing?: number;
  }
): ReinoEditorialBookSpecsSeed {
  const trimSizeId = isSupportedKdpTrimSizeId(trimSizeIdInput)
    ? trimSizeIdInput
    : REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID;
  const pageCount = options?.pageCount ?? 24;
  const margins = getKdpMinimumMargins(pageCount, false);

  return {
    trim_size_id: trimSizeId,
    print_type: options?.printType ?? "black_and_white",
    paper_type: options?.paperType ?? "cream",
    binding: options?.binding ?? "paperback",
    bleed: options?.bleed ?? "no_bleed",
    font_size: options?.fontSize ?? getReinoEditorialDefaultFontSize(trimSizeId),
    line_spacing: options?.lineSpacing ?? getReinoEditorialDefaultLineSpacing(),
    margin_top: margins.top,
    margin_bottom: margins.bottom,
    margin_inner: margins.gutter,
    margin_outer: margins.outside,
    layout_template: getReinoEditorialLayoutPresetId(trimSizeId),
  };
}

export function buildReinoEditorialBookSpecsSeed(
  trimSizeIdInput: string | null | undefined
): ReinoEditorialBookSpecsSeed {
  return buildEditorialBookSpecsSeed(
    resolveReinoEditorialCollectionTrimSizeId(trimSizeIdInput)
  );
}
