/* ------------------------------------------------------------------ */
/*  Pricing Engine — Core Calculation                                  */
/*  Calculates editorial service prices with country, complexity,      */
/*  and special discount adjustments                                   */
/* ------------------------------------------------------------------ */

import { SERVICE_PRICES } from "./service-catalog";
import {
  COUNTRY_PRICING,
  COMPLEXITY_LEVELS,
  DISCOUNT_TYPE_LABELS,
  CRM_TAG_DISCOUNT_MAP,
  type PriceEstimateInput,
  type PriceEstimateBreakdown,
  type PricingMetadata,
  type SpecialDiscount,
  type DiscountType,
  type CRMClientTag,
  type BookComplexity,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Auto-detect complexity from page count                             */
/* ------------------------------------------------------------------ */

export function detectComplexity(pageCount: number): BookComplexity {
  if (pageCount <= 80) return "short";
  if (pageCount <= 200) return "standard";
  if (pageCount <= 400) return "long";
  return "complex";
}

/* ------------------------------------------------------------------ */
/*  Calculate Price Estimate                                           */
/* ------------------------------------------------------------------ */

export function calculatePriceEstimate(
  input: PriceEstimateInput
): PriceEstimateBreakdown {
  const locale = input.locale;

  // 1. Sum selected services
  const servicesBreakdown = input.selectedServices.map((key) => {
    const service = SERVICE_PRICES[key];
    return {
      key,
      name: service.name[locale],
      basePrice: service.basePrice,
    };
  });

  const baseServicesTotal = servicesBreakdown.reduce(
    (sum, s) => sum + s.basePrice,
    0
  );

  // 2. Country multiplier
  let countryMultiplier: number;
  let countryName: string;
  let currency: string;

  if (input.country === "custom" && input.customCountry) {
    countryMultiplier = input.customCountry.multiplier;
    countryName = input.customCountry.countryName;
    currency = input.customCountry.currency;
  } else if (input.country !== "custom") {
    const cp = COUNTRY_PRICING[input.country];
    countryMultiplier = cp.multiplier;
    countryName = cp.label[locale];
    currency = cp.currency;
  } else {
    countryMultiplier = 1.0;
    countryName = locale === "es" ? "Sin definir" : "Undefined";
    currency = "USD";
  }

  const afterCountryAdjustment = roundCents(
    baseServicesTotal * countryMultiplier
  );

  // 3. Complexity multiplier
  const cl = COMPLEXITY_LEVELS[input.complexity];
  const complexityMultiplier = cl.multiplier;
  const complexityLabel = cl.label[locale];

  const afterComplexityAdjustment = roundCents(
    afterCountryAdjustment * complexityMultiplier
  );

  // 4. Apply special discount
  let discountApplied = false;
  let discountType: DiscountType | null = null;
  let discountMode: SpecialDiscount["mode"] | null = null;
  let discountValue = 0;
  let discountLabel = "";
  let discountAmount = 0;
  let finalPrice = afterComplexityAdjustment;

  if (input.discount) {
    discountApplied = true;
    discountType = input.discount.type;
    discountMode = input.discount.mode;
    discountValue = input.discount.value;
    discountLabel = DISCOUNT_TYPE_LABELS[input.discount.type][locale];

    if (input.discount.mode === "percentage") {
      discountAmount = roundCents(
        afterComplexityAdjustment * (input.discount.value / 100)
      );
      discountLabel += ` (${input.discount.value}%)`;
    } else {
      discountAmount = input.discount.value;
      discountLabel += ` (-$${input.discount.value.toFixed(2)})`;
    }

    finalPrice = roundCents(afterComplexityAdjustment - discountAmount);
    if (finalPrice < 0) finalPrice = 0;
  }

  return {
    baseServicesTotal,
    countryMultiplier,
    countryName,
    afterCountryAdjustment,
    complexityMultiplier,
    complexityLabel,
    afterComplexityAdjustment,
    discountApplied,
    discountType,
    discountMode,
    discountValue,
    discountLabel,
    discountAmount,
    finalPrice,
    currency,
    servicesBreakdown,
  };
}

/* ------------------------------------------------------------------ */
/*  Create Full Pricing Metadata                                       */
/* ------------------------------------------------------------------ */

export function createPricingMetadata(
  input: PriceEstimateInput,
  approvedBy?: string
): PricingMetadata {
  const breakdown = calculatePriceEstimate(input);
  const now = new Date().toISOString();

  return {
    estimateId: `EST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    input,
    breakdown,
    contractDisplayMode: "final_only",
    approved: !!approvedBy,
    approvedBy: approvedBy ?? null,
    approvedAt: approvedBy ? now : null,
  };
}

/* ------------------------------------------------------------------ */
/*  CRM Auto-Suggest Discount                                          */
/* ------------------------------------------------------------------ */

export interface CRMDiscountSuggestion {
  suggested: boolean;
  discountType: DiscountType | null;
  label: { es: string; en: string };
  reason: { es: string; en: string };
  defaultPercentage: number;
}

/**
 * Suggest a discount based on CRM client tags.
 * Returns a suggestion that staff must manually approve.
 */
export function suggestDiscountFromCRM(
  clientTags: CRMClientTag[]
): CRMDiscountSuggestion {
  for (const tag of clientTags) {
    const discountType = CRM_TAG_DISCOUNT_MAP[tag];
    if (discountType) {
      const defaultPercentages: Record<DiscountType, number> = {
        pastor: 10,
        church: 15,
        ministry: 10,
        christian_manual: 10,
        special_courtesy: 5,
        custom: 0,
      };

      return {
        suggested: true,
        discountType,
        label: DISCOUNT_TYPE_LABELS[discountType],
        reason: {
          es: `Cliente identificado como: ${tag}`,
          en: `Client identified as: ${tag}`,
        },
        defaultPercentage: defaultPercentages[discountType],
      };
    }
  }

  return {
    suggested: false,
    discountType: null,
    label: { es: "", en: "" },
    reason: { es: "", en: "" },
    defaultPercentage: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Format Price Summary                                               */
/* ------------------------------------------------------------------ */

export function formatPriceSummary(
  breakdown: PriceEstimateBreakdown,
  locale: "es" | "en"
): string {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const lines: string[] = [];

  if (locale === "es") {
    lines.push(`Total servicios base: ${fmt(breakdown.baseServicesTotal)}`);
    lines.push(
      `Multiplicador país (${breakdown.countryName}): ${breakdown.countryMultiplier}`
    );
    lines.push(
      `Multiplicador complejidad (${breakdown.complexityLabel}): ${breakdown.complexityMultiplier}`
    );
    lines.push(`Subtotal: ${fmt(breakdown.afterComplexityAdjustment)}`);
    if (breakdown.discountApplied) {
      lines.push(
        `Descuento aplicado: ${breakdown.discountLabel} (-${fmt(breakdown.discountAmount)})`
      );
    }
    lines.push(`Precio final: ${fmt(breakdown.finalPrice)}`);
  } else {
    lines.push(`Base services total: ${fmt(breakdown.baseServicesTotal)}`);
    lines.push(
      `Country multiplier (${breakdown.countryName}): ${breakdown.countryMultiplier}`
    );
    lines.push(
      `Complexity multiplier (${breakdown.complexityLabel}): ${breakdown.complexityMultiplier}`
    );
    lines.push(`Subtotal: ${fmt(breakdown.afterComplexityAdjustment)}`);
    if (breakdown.discountApplied) {
      lines.push(
        `Discount applied: ${breakdown.discountLabel} (-${fmt(breakdown.discountAmount)})`
      );
    }
    lines.push(`Final price: ${fmt(breakdown.finalPrice)}`);
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Generate Invoice Items from Pricing Breakdown                      */
/* ------------------------------------------------------------------ */

export function breakdownToInvoiceItems(
  breakdown: PriceEstimateBreakdown
): {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}[] {
  const items = breakdown.servicesBreakdown.map((s) => ({
    description: s.name,
    quantity: 1,
    unitPrice: roundCents(
      s.basePrice *
        breakdown.countryMultiplier *
        breakdown.complexityMultiplier
    ),
    amount: roundCents(
      s.basePrice *
        breakdown.countryMultiplier *
        breakdown.complexityMultiplier
    ),
  }));

  return items;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}
