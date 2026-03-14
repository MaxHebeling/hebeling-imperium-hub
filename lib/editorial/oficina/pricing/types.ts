/* ------------------------------------------------------------------ */
/*  Pricing Engine — Types                                             */
/*  Country multipliers, complexity levels, discounts, estimates        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Country Pricing                                                    */
/* ------------------------------------------------------------------ */

export type PredefinedCountry = "usa" | "mexico" | "argentina";

export interface CountryPricing {
  country: PredefinedCountry;
  multiplier: number;
  currency: "USD" | "MXN" | "ARS";
  label: { es: string; en: string };
}

export interface CustomCountryPricing {
  countryName: string;
  multiplier: number;
  currency: string;
}

export const COUNTRY_PRICING: Record<PredefinedCountry, CountryPricing> = {
  usa: {
    country: "usa",
    multiplier: 1.0,
    currency: "USD",
    label: { es: "Estados Unidos", en: "United States" },
  },
  mexico: {
    country: "mexico",
    multiplier: 0.65,
    currency: "USD",
    label: { es: "México", en: "Mexico" },
  },
  argentina: {
    country: "argentina",
    multiplier: 0.40,
    currency: "USD",
    label: { es: "Argentina", en: "Argentina" },
  },
};

/* ------------------------------------------------------------------ */
/*  Project Complexity                                                 */
/* ------------------------------------------------------------------ */

export type BookComplexity = "short" | "standard" | "long" | "complex";

export interface ComplexityLevel {
  key: BookComplexity;
  multiplier: number;
  maxPages: number | null; // null = no upper limit
  minPages: number;
  label: { es: string; en: string };
  description: { es: string; en: string };
}

export const COMPLEXITY_LEVELS: Record<BookComplexity, ComplexityLevel> = {
  short: {
    key: "short",
    multiplier: 0.8,
    minPages: 0,
    maxPages: 80,
    label: { es: "Libro corto", en: "Short book" },
    description: { es: "Hasta 80 páginas", en: "Up to 80 pages" },
  },
  standard: {
    key: "standard",
    multiplier: 1.0,
    minPages: 80,
    maxPages: 200,
    label: { es: "Libro estándar", en: "Standard book" },
    description: { es: "80–200 páginas", en: "80–200 pages" },
  },
  long: {
    key: "long",
    multiplier: 1.25,
    minPages: 200,
    maxPages: 400,
    label: { es: "Libro largo", en: "Long book" },
    description: { es: "200–400 páginas", en: "200–400 pages" },
  },
  complex: {
    key: "complex",
    multiplier: 1.5,
    minPages: 400,
    maxPages: null,
    label: { es: "Libro complejo", en: "Complex book" },
    description: { es: "Más de 400 páginas", en: "Over 400 pages" },
  },
};

/* ------------------------------------------------------------------ */
/*  Service Pricing                                                    */
/* ------------------------------------------------------------------ */

export type ServiceKey =
  | "correccion_ortotipografica"
  | "correccion_gramatical"
  | "correccion_estilo"
  | "diseno_interior"
  | "diseno_portada"
  | "ebook_conversion"
  | "publicacion_amazon"
  | "distribucion"
  | "revision_edicion"
  | "editorial_completo"
  | "isbn"
  | "copyright_usa"
  | "copyright_mx"
  | "copyright_ar"
  | "reedicion"
  | "rediseno_portada";

export interface ServicePrice {
  key: ServiceKey;
  basePrice: number; // USD base price
  name: { es: string; en: string };
  description: { es: string; en: string };
  category: "correction" | "design" | "publishing" | "legal" | "package";
}

/* ------------------------------------------------------------------ */
/*  Special Discounts                                                  */
/* ------------------------------------------------------------------ */

export type DiscountType =
  | "pastor"
  | "church"
  | "ministry"
  | "christian_manual"
  | "special_courtesy"
  | "custom";

export type DiscountMode = "percentage" | "fixed";

export interface SpecialDiscount {
  type: DiscountType;
  mode: DiscountMode;
  value: number; // percentage (0-100) or fixed amount
  reason: string;
  approvedBy: string;
  suggestedByCRM: boolean;
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, { es: string; en: string }> = {
  pastor: {
    es: "Descuento Pastoral",
    en: "Pastor Discount",
  },
  church: {
    es: "Descuento Iglesia",
    en: "Church Discount",
  },
  ministry: {
    es: "Descuento Ministerial",
    en: "Ministry Discount",
  },
  christian_manual: {
    es: "Descuento Manual Cristiano / Material Didáctico",
    en: "Christian Manual / Teaching Material Discount",
  },
  special_courtesy: {
    es: "Descuento de Cortesía Especial",
    en: "Special Courtesy Discount",
  },
  custom: {
    es: "Descuento Personalizado",
    en: "Custom Discount",
  },
};

export const DISCOUNT_REASON_PRESETS: { es: string; en: string }[] = [
  { es: "Cortesía pastoral", en: "Pastoral courtesy" },
  { es: "Apoyo a proyecto de iglesia", en: "Church project support" },
  { es: "Manual para capacitación ministerial", en: "Manual for ministry training" },
  { es: "Descuento ministerial especial", en: "Special ministry discount" },
  { es: "Descuento cliente estratégico", en: "Strategic client discount" },
];

/* ------------------------------------------------------------------ */
/*  CRM Client Tags for Auto-Suggest                                   */
/* ------------------------------------------------------------------ */

export type CRMClientTag =
  | "pastor"
  | "church"
  | "ministry"
  | "christian_organization"
  | "returning_client"
  | "strategic_partner";

/** Mapping from CRM tags to suggested discount types */
export const CRM_TAG_DISCOUNT_MAP: Record<CRMClientTag, DiscountType | null> = {
  pastor: "pastor",
  church: "church",
  ministry: "ministry",
  christian_organization: "ministry",
  returning_client: "special_courtesy",
  strategic_partner: "special_courtesy",
};

/* ------------------------------------------------------------------ */
/*  Price Estimate                                                     */
/* ------------------------------------------------------------------ */

export interface PriceEstimateInput {
  selectedServices: ServiceKey[];
  country: PredefinedCountry | "custom";
  customCountry?: CustomCountryPricing;
  complexity: BookComplexity;
  pageCount?: number;
  discount?: SpecialDiscount;
  locale: "es" | "en";
}

export interface PriceEstimateBreakdown {
  /** Sum of all selected service base prices */
  baseServicesTotal: number;
  /** Country multiplier applied */
  countryMultiplier: number;
  countryName: string;
  /** After country adjustment */
  afterCountryAdjustment: number;
  /** Complexity multiplier applied */
  complexityMultiplier: number;
  complexityLabel: string;
  /** After complexity adjustment */
  afterComplexityAdjustment: number;
  /** Discount details */
  discountApplied: boolean;
  discountType: DiscountType | null;
  discountMode: DiscountMode | null;
  discountValue: number;
  discountLabel: string;
  discountAmount: number; // actual dollar amount removed
  /** Final price */
  finalPrice: number;
  /** Currency */
  currency: string;
  /** Selected services breakdown */
  servicesBreakdown: {
    key: ServiceKey;
    name: string;
    basePrice: number;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Contract Price Display Mode                                        */
/* ------------------------------------------------------------------ */

export type ContractPriceDisplayMode =
  | "final_only"        // Only show final agreed price
  | "full_breakdown";   // Show original + discount + final

export interface PricingMetadata {
  estimateId: string;
  createdAt: string;
  input: PriceEstimateInput;
  breakdown: PriceEstimateBreakdown;
  contractDisplayMode: ContractPriceDisplayMode;
  /** Whether staff has approved this estimate */
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}
