import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { createEditorialComment, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { isValidStageKey } from "@/lib/editorial/pipeline/stage-utils";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { notifyStaffComment, notifySuggestion } from "@/lib/editorial/notifications/service";
import { getAdminClient } from "@/lib/leads/helpers";

/**
 * POST /api/staff/projects/[projectId]/comments
 * Body JSON:
 * - comment (string) [required]
 * - visibility (internal|client|public) [required]
 * - stageKey (string) [optional]
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
      capability: "comments:create",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const comment = String(body?.comment ?? "").trim();
    const visibility = String(body?.visibility ?? "");
    const stageKeyRaw = body?.stageKey ? String(body.stageKey) : null;

    if (!comment) {
      return NextResponse.json({ success: false, error: "comment is required" }, { status: 400 });
    }
    if (!["internal", "client", "public"].includes(visibility)) {
      return NextResponse.json({ success: false, error: "Invalid visibility" }, { status: 400 });
    }
    if (stageKeyRaw && !isValidStageKey(stageKeyRaw)) {
      return NextResponse.json(
        { success: false, error: `Invalid stageKey: ${stageKeyRaw}` },
        { status: 400 }
      );
    }
    const stageKey = stageKeyRaw ? (stageKeyRaw as EditorialStageKey) : null;

    await createEditorialComment({
      projectId,
      stageKey,
      comment,
      visibility: visibility as "internal" | "client" | "public",
      authorType: "staff",
      authorId: staff.userId,
    });

    await logEditorialActivity(projectId, "comment_added_by_staff", {
      stageKey: stageKey ?? undefined,
      actorId: staff.userId,
      actorType: "staff",
      payload: { visibility },
    });

    // Notify client if comment is visible to them
    if (visibility === "client" || visibility === "public") {
      try {
        const admin = getAdminClient();
        const { data: proj } = await admin
          .from("editorial_projects")
          .select("client_id, title")
          .eq("id", projectId)
          .single();
        const { data: staffProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", staff.userId)
          .single();
        const staffName = staffProfile?.full_name || "Equipo Editorial";
        if (proj?.client_id) {
          await notifyStaffComment(
            projectId,
            proj.client_id,
            comment,
            staffName,
            stageKey
          );
        }
      } catch (notifErr) {
        console.error("[staff/comments] notification error:", notifErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[staff/comments] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

