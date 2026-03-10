// =============================================================================
// API Route — Export Runs
// Editorial Publishing Engine · Phase 7
// GET /api/editorial/publishing/exports?publication_version_id=...
// POST /api/editorial/publishing/exports — create export run
// PATCH /api/editorial/publishing/exports — start | complete | fail | cancel
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createExportRun,
  startExportRun,
  completeExportRun,
  failExportRun,
  cancelExportRun,
  listExportRuns,
} from "@/lib/editorial/publishing/export-service";
import { validatePublishingReadiness } from "@/lib/editorial/publishing/publishing-validation-service";
import type { CreateExportRunInput, ExportFormat } from "@/types/editorial";

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

// GET /api/editorial/publishing/exports?publication_version_id=...
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

    const runs = await listExportRuns(pubVersionId);
    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    console.error("[api/editorial/publishing/exports] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/publishing/exports — queue a new export
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: { project_id: string; publication_version_id: string; format: ExportFormat } =
      await request.json();

    if (!body.project_id || !body.publication_version_id || !body.format) {
      return NextResponse.json(
        { success: false, error: "project_id, publication_version_id and format are required" },
        { status: 400 }
      );
    }

    // Pre-export validation gate
    const readiness = await validatePublishingReadiness(body.project_id, null, null);
    if (!readiness.ready) {
      return NextResponse.json(
        { success: false, error: "Publishing readiness checks failed", blockers: readiness.blockers },
        { status: 422 }
      );
    }

    const input: CreateExportRunInput = {
      project_id: body.project_id,
      publication_version_id: body.publication_version_id,
      format: body.format,
      initiated_by: auth.user.id,
    };

    const run = await createExportRun(input);
    return NextResponse.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/publishing/exports] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/publishing/exports — update run status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthedProfile(supabase);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: {
      run_id: string;
      action: "start" | "complete" | "fail" | "cancel";
      output?: { file_url: string; storage_path?: string; size_bytes?: number };
      error_message?: string;
      error_details?: Record<string, unknown>;
    } = await request.json();

    if (!body.run_id || !body.action) {
      return NextResponse.json(
        { success: false, error: "run_id and action are required" },
        { status: 400 }
      );
    }

    let result;
    switch (body.action) {
      case "start":
        result = await startExportRun(body.run_id);
        break;
      case "complete":
        if (!body.output?.file_url) {
          return NextResponse.json(
            { success: false, error: "output.file_url is required for complete action" },
            { status: 400 }
          );
        }
        result = await completeExportRun(body.run_id, body.output);
        break;
      case "fail":
        result = await failExportRun(body.run_id, body.error_message ?? "Unknown error", body.error_details);
        break;
      case "cancel":
        result = await cancelExportRun(body.run_id);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "action must be start | complete | fail | cancel" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[api/editorial/publishing/exports] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
