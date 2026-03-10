// =============================================================================
// API Route — Publication Metadata
// Editorial Publishing Engine · Phase 7
// GET /api/editorial/publishing/metadata?publication_version_id=...
// POST /api/editorial/publishing/metadata — upsert metadata
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicationMetadata,
  upsertPublicationMetadata,
} from "@/lib/editorial/publishing/metadata-service";
import type { UpsertPublicationMetadataInput } from "@/types/editorial";

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

// GET /api/editorial/publishing/metadata?publication_version_id=...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pubVersionId = searchParams.get("publication_version_id");
    if (!pubVersionId) {
      return NextResponse.json(
        { success: false, error: "publication_version_id is required" },
        { status: 400 }
      );
    }

    const metadata = await getPublicationMetadata(pubVersionId);
    return NextResponse.json({ success: true, data: metadata });
  } catch (error) {
    console.error("[api/editorial/publishing/metadata] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/publishing/metadata — create or update metadata
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: UpsertPublicationMetadataInput = await request.json();
    if (!body.publication_version_id || !body.project_id || !body.title) {
      return NextResponse.json(
        { success: false, error: "publication_version_id, project_id and title are required" },
        { status: 400 }
      );
    }

    const metadata = await upsertPublicationMetadata(body);
    return NextResponse.json({ success: true, data: metadata }, { status: 200 });
  } catch (error) {
    console.error("[api/editorial/publishing/metadata] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
