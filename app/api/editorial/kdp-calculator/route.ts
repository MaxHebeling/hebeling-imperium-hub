import { NextRequest, NextResponse } from "next/server";
import { calculateKdpCoverDimensions } from "@/lib/editorial/kdp";
import type { KdpFormatConfig } from "@/lib/editorial/kdp";

/**
 * POST /api/editorial/kdp-calculator
 *
 * Calculates Amazon KDP cover dimensions based on trim size, paper type,
 * binding, bleed, and page count.
 *
 * Body: KdpFormatConfig
 * Response: KdpCoverDimensions | { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trimSizeId, paperType, binding, bleed, pageCount } = body as KdpFormatConfig;

    if (!trimSizeId || !paperType || !binding || !bleed || !pageCount) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son requeridos: trimSizeId, paperType, binding, bleed, pageCount" },
        { status: 400 }
      );
    }

    const result = calculateKdpCoverDimensions({
      trimSizeId,
      paperType,
      binding,
      bleed,
      pageCount: Number(pageCount),
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, dimensions: result });
  } catch (error) {
    console.error("[kdp-calculator] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
