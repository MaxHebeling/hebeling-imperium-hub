export {
  KDP_TRIM_SIZES,
  KDP_PAPER_SPECS,
  KDP_PAPER_LABELS,
  KDP_BINDING_LABELS,
  KDP_BLEED_LABELS,
  calculateKdpCoverDimensions,
  getKdpMinimumMargins,
} from "./constants";

export {
  REINO_EDITORIAL_COLLECTION_TRIM_SIZE_IDS,
  REINO_EDITORIAL_COLLECTION_TRIM_SIZE_OPTIONS,
  REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID,
  isReinoEditorialCollectionTrimSizeId,
  isSupportedKdpTrimSizeId,
  resolveReinoEditorialCollectionTrimSizeId,
  getReinoEditorialLayoutPresetId,
  buildEditorialBookSpecsSeed,
  buildReinoEditorialBookSpecsSeed,
} from "./reino-collection";

export {
  REINO_EDITORIAL_DEFAULT_TYPOGRAPHY_PRESET_ID,
  REINO_EDITORIAL_TYPOGRAPHY_PRESET_OPTIONS,
  REINO_EDITORIAL_FONT_SIZE_OPTIONS,
  isReinoEditorialTypographyPresetId,
  resolveReinoEditorialTypographyPresetId,
  getReinoEditorialTypographyPreset,
  getReinoEditorialDefaultFontSize,
  getReinoEditorialDefaultLineSpacing,
} from "./typography";

export type {
  KdpPaperType,
  KdpBindingType,
  KdpBleedOption,
  KdpTrimSize,
  KdpPaperSpec,
  KdpCoverDimensions,
  KdpFormatConfig,
} from "./types";

export type {
  ReinoEditorialCollectionTrimSizeId,
} from "./reino-collection";

export type {
  ReinoEditorialTypographyPresetId,
} from "./typography";
