import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addPermitHunterNote,
  getPermitHunterLeadDetail,
} from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

const noteSchema = z.object({
  note: z.string().min(1),
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
  return NextResponse.json({ success: true, notes: detail.notes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { permitNumber } = await params;
  const body = noteSchema.parse(await request.json());
  const note = await addPermitHunterNote(
    decodeURIComponent(permitNumber),
    body.note,
    access.staff.email ?? access.staff.userId
  );

  if (!note) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    note,
  });
}
