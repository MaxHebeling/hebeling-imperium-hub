/* ------------------------------------------------------------------ */
/*  POST /api/staff/oficina/pricing                                    */
/*  Pricing Engine — calculate estimates, suggest discounts            */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import {
  calculatePriceEstimate,
  createPricingMetadata,
  suggestDiscountFromCRM,
  formatPriceSummary,
  breakdownToInvoiceItems,
} from "@/lib/editorial/oficina/pricing";
import type {
  PriceEstimateInput,
  CRMClientTag,
} from "@/lib/editorial/oficina/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    /* -------------------------------------------------------------- */
    /*  action: calculate — run full price calculation                 */
    /* -------------------------------------------------------------- */
    if (action === "calculate") {
      const { input } = body as { input: PriceEstimateInput };

      if (!input?.selectedServices?.length) {
        return NextResponse.json(
          { error: "Se requiere al menos un servicio seleccionado." },
          { status: 400 }
        );
      }

      const breakdown = calculatePriceEstimate(input);
      const summary = formatPriceSummary(breakdown, input.locale);

      return NextResponse.json({ breakdown, summary });
    }

    /* -------------------------------------------------------------- */
    /*  action: create_estimate — full metadata with approval flow     */
    /* -------------------------------------------------------------- */
    if (action === "create_estimate") {
      const { input, approvedBy } = body as {
        input: PriceEstimateInput;
        approvedBy?: string;
      };

      if (!input?.selectedServices?.length) {
        return NextResponse.json(
          { error: "Se requiere al menos un servicio seleccionado." },
          { status: 400 }
        );
      }

      const metadata = createPricingMetadata(input, approvedBy);

      return NextResponse.json({ metadata });
    }

    /* -------------------------------------------------------------- */
    /*  action: suggest_discount — CRM-based discount suggestion       */
    /* -------------------------------------------------------------- */
    if (action === "suggest_discount") {
      const { clientTags } = body as { clientTags: CRMClientTag[] };

      if (!clientTags?.length) {
        return NextResponse.json({
          suggestion: {
            suggested: false,
            discountType: null,
            label: { es: "", en: "" },
            reason: { es: "", en: "" },
            defaultPercentage: 0,
          },
        });
      }

      const suggestion = suggestDiscountFromCRM(clientTags);

      return NextResponse.json({ suggestion });
    }

    /* -------------------------------------------------------------- */
    /*  action: invoice_items — convert breakdown to invoice items     */
    /* -------------------------------------------------------------- */
    if (action === "invoice_items") {
      const { input } = body as { input: PriceEstimateInput };

      if (!input?.selectedServices?.length) {
        return NextResponse.json(
          { error: "Se requiere al menos un servicio seleccionado." },
          { status: 400 }
        );
      }

      const breakdown = calculatePriceEstimate(input);
      const items = breakdownToInvoiceItems(breakdown);

      return NextResponse.json({
        items,
        subtotal: breakdown.afterComplexityAdjustment,
        discountAmount: breakdown.discountAmount,
        finalTotal: breakdown.finalPrice,
        currency: breakdown.currency,
      });
    }

    return NextResponse.json(
      {
        error: `Acción desconocida: ${action}. Acciones válidas: calculate, create_estimate, suggest_discount, invoice_items`,
      },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
