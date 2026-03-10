// =============================================================================
// API Route — Publishing Versions
// Editorial Publishing Engine · Phase 7
// GET /api/editorial/publishing?project_id=...
// POST /api/editorial/publishing
// PATCH /api/editorial/publishing
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPublicationVersions } from "@/lib/editorial/publishing/publishing-service";
import {
  createPublicationVersion,
  updatePublicationVersionStatus,
  updatePublicationVersionNotes,
} from "@/lib/editorial/publishing/publication-version-service";
import type {
  CreatePublicationVersionInput,
  PublicationVersionStatus,
} from "@/types/editorial";

const ALLOWED_ROLES = ["superadmin", "admin", "ops"];

async function getAuthedProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { user, profile };
}

// GET /api/editorial/publishing?project_id=...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "project_id is required" },
        { status: 400 }
      );
    }

    const versions = await listPublicationVersions(projectId);
    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error("[api/editorial/publishing] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/publishing — create a publication version
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: CreatePublicationVersionInput = await request.json();
    if (!body.project_id || !body.label || !body.version_tag) {
      return NextResponse.json(
        { success: false, error: "project_id, label and version_tag are required" },
        { status: 400 }
      );
    }

    const version = await createPublicationVersion({
      ...body,
      created_by: auth.user.id,
    });
    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/publishing] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/publishing — update status or notes
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: {
      version_id: string;
      action: "update_status" | "update_notes";
      status?: PublicationVersionStatus;
      notes?: string;
    } = await request.json();

    if (!body.version_id || !body.action) {
      return NextResponse.json(
        { success: false, error: "version_id and action are required" },
        { status: 400 }
      );
    }

    if (body.action === "update_status") {
      if (!body.status) {
        return NextResponse.json({ success: false, error: "status is required" }, { status: 400 });
      }
      const updated = await updatePublicationVersionStatus(
        body.version_id,
        body.status,
        auth.user.id
      );
      return NextResponse.json({ success: true, data: updated });
    }

    if (body.action === "update_notes") {
      const updated = await updatePublicationVersionNotes(body.version_id, body.notes ?? "");
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: "action must be update_status or update_notes" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/editorial/publishing] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
