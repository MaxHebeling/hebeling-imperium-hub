import { NextResponse } from "next/server";
import { z } from "zod";

import { addPermitHunterTask } from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z
    .enum(["call", "text", "email", "research", "site_visit", "estimate", "follow_up", "custom"])
    .default("follow_up"),
  status: z.enum(["open", "in_progress", "done", "blocked"]).default("open"),
  dueAt: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ permitNumber: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { permitNumber } = await params;
  const body = taskSchema.parse(await request.json());
  const task = await addPermitHunterTask(decodeURIComponent(permitNumber), {
    title: body.title,
    description: body.description ?? null,
    type: body.type,
    status: body.status,
    dueAt: body.dueAt ?? null,
    assignedTo: body.assignedTo ?? null,
  });

  if (!task) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    task,
  });
}
