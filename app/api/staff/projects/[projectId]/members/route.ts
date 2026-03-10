import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject, getProfileByEmail } from "@/lib/editorial/db/queries";
import { upsertProjectMember, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";

/**
 * POST /api/staff/projects/[projectId]/members
 * Body JSON:
 * - email (string) [required]
 * - role (author|reviewer|editor) [required]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();

    const { projectId } = await params;
    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "assignment:change",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "").trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }
    if (!["author", "reviewer", "editor"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const profile = await getProfileByEmail(email);
    if (!profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await upsertProjectMember({
      projectId,
      userId: profile.id,
      role: role as "author" | "reviewer" | "editor",
    });

    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      eventType: "assignment_changed",
      actorId: staff.userId,
      actorRole: staff.role,
      payload: { assignmentType: "member", role, userId: profile.id, email },
    });

    await logEditorialActivity(projectId, "member_assigned_by_staff", {
      actorId: staff.userId,
      actorType: "staff",
      payload: { role, userId: profile.id, email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[staff/members] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

