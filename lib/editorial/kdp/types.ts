/** Amazon KDP format specification types */

export type KdpPaperType = "white" | "cream" | "color_standard" | "color_premium";

export type KdpBindingType = "paperback" | "hardcover";

export type KdpBleedOption = "no_bleed" | "bleed";

export interface KdpTrimSize {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
  widthMm: number;
  heightMm: number;
  /** Binding types this trim size supports */
  bindings: KdpBindingType[];
  /** Whether bleed is available for this trim size */
  bleedAvailable: boolean;
}

export interface KdpPaperSpec {
  type: KdpPaperType;
  label: string;
  /** Pages per inch — used to calculate spine width */
  ppi: number;
  /** Thickness per page in inches (1/PPI) */
  thicknessPerPageIn: number;
  /** Minimum page count */
  minPages: number;
  /** Maximum page count */
  maxPages: number;
  /** Supported binding types */
  bindings: KdpBindingType[];
}

export interface KdpCoverDimensions {
  /** Full cover width in inches (back + spine + front + bleed) */
  fullWidthIn: number;
  /** Full cover height in inches (trim height + bleed) */
  fullHeightIn: number;
  /** Full cover width in mm */
  fullWidthMm: number;
  /** Full cover height in mm */
  fullHeightMm: number;
  /** Spine width in inches */
  spineWidthIn: number;
  /** Spine width in mm */
  spineWidthMm: number;
  /** Bleed per side in inches */
  bleedIn: number;
  /** Full cover width in pixels at 300 DPI */
  fullWidthPx: number;
  /** Full cover height in pixels at 300 DPI */
  fullHeightPx: number;
  /** Whether spine text is recommended (spine > 0.5") */
  spineTextRecommended: boolean;
  /** Trim size used */
  trimSize: KdpTrimSize;
  /** Paper type used */
  paperType: KdpPaperType;
  /** Page count used */
  pageCount: number;
  /** Binding type */
  binding: KdpBindingType;
  /** Bleed option */
  bleed: KdpBleedOption;
}

export interface KdpFormatConfig {
  trimSizeId: string;
  paperType: KdpPaperType;
  binding: KdpBindingType;
  bleed: KdpBleedOption;
  pageCount: number;
}
