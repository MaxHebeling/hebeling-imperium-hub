import { NextResponse } from "next/server";

import { getPermitHunterLeadDetail } from "@/lib/lead-hunter/permit-hunter-service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const { permitNumber } = await params;
  const detail = await getPermitHunterLeadDetail(decodeURIComponent(permitNumber));

  if (!detail.lead) {
    return NextResponse.json(
      {
        success: false,
        error: "Lead not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    detail,
  });
}
