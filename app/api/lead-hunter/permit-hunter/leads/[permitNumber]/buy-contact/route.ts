import { NextResponse } from "next/server";

import { buyPermitHunterContact } from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

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
