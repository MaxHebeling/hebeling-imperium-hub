import { NextResponse } from "next/server";

import { buyPermitHunterContact } from "@/lib/lead-hunter/permit-hunter-service";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const { permitNumber } = await params;
  const result = await buyPermitHunterContact(decodeURIComponent(permitNumber));

  if (!result) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    enrichment: result.enrichment,
    lead: result.lead,
  });
}
