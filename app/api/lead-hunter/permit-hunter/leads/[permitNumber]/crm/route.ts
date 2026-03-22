import { NextResponse } from "next/server";
import { z } from "zod";

import { savePermitHunterCrmRecord } from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

const crmSchema = z.object({
  stage: z
    .enum([
      "new_lead",
      "needs_enrichment",
      "ready_to_contact",
      "contacted",
      "appointment_set",
      "proposal_sent",
      "won",
      "lost",
    ])
    .optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  assignedTo: z.string().nullable().optional(),
  estimatedValue: z.number().nullable().optional(),
  nextAction: z.string().nullable().optional(),
  nextActionDueAt: z.string().nullable().optional(),
  lastActivityAt: z.string().nullable().optional(),
  workflowSummary: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { permitNumber } = await params;
  const body = crmSchema.parse(await request.json());
  const record = await savePermitHunterCrmRecord(
    decodeURIComponent(permitNumber),
    body
  );

  if (!record) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    crm: record,
  });
}
