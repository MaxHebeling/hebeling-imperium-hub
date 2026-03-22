import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getPermitHunterLeadDetail,
  savePermitHunterOutreach,
} from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

const outreachSchema = z.object({
  status: z.enum(["new", "attempted", "contacted", "won", "lost"]),
  channel: z.enum(["call", "text", "email", "other"]).nullable(),
  ownerResponse: z.string().nullable(),
  lastContactedAt: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { permitNumber } = await params;
  const detail = await getPermitHunterLeadDetail(decodeURIComponent(permitNumber));
  return NextResponse.json({ success: true, outreach: detail.outreach });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { permitNumber } = await params;
  const body = outreachSchema.parse(await request.json());
  const outreach = await savePermitHunterOutreach(
    decodeURIComponent(permitNumber),
    body
  );

  if (!outreach) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    outreach,
  });
}
