import { NextResponse } from "next/server";
import { z } from "zod";

import { updatePermitHunterTask } from "@/lib/lead-hunter/permit-hunter-service";
import { requirePermitHunterStaffAccess } from "@/lib/lead-hunter/route-auth";

const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["open", "in_progress", "done", "blocked"]).optional(),
  dueAt: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const access = await requirePermitHunterStaffAccess();
  if (!access.ok) {
    return access.response;
  }

  const { taskId } = await params;
  const body = taskUpdateSchema.parse(await request.json());
  const task = await updatePermitHunterTask(taskId, body);

  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    task,
  });
}
