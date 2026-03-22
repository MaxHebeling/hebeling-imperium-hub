import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addPermitHunterNote,
  getPermitHunterLeadDetail,
} from "@/lib/lead-hunter/permit-hunter-service";

const noteSchema = z.object({
  note: z.string().min(1),
  createdBy: z.string().min(1).default("operator"),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const { permitNumber } = await params;
  const detail = await getPermitHunterLeadDetail(decodeURIComponent(permitNumber));
  return NextResponse.json({ success: true, notes: detail.notes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const { permitNumber } = await params;
  const body = noteSchema.parse(await request.json());
  const note = await addPermitHunterNote(
    decodeURIComponent(permitNumber),
    body.note,
    body.createdBy
  );

  if (!note) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    note,
  });
}
