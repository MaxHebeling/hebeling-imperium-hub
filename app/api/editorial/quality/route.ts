import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createQualityCheck,
  resolveQualityCheck,
  listQualityChecks,
  saveQualityScore,
  computeAndSaveOverallScore,
  getLatestScores,
} from "@/lib/editorial/quality";
import type { CreateQualityCheckInput, EditorialStage } from "@/types/editorial";

// GET /api/editorial/quality?project_id=...&type=checks|scores
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const type = searchParams.get("type") ?? "checks";

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "project_id query param is required" },
        { status: 400 }
      );
    }

    if (type === "scores") {
      const scores = await getLatestScores(projectId);
      return NextResponse.json({ success: true, data: scores });
    }

    // Default: checks
    const stage = searchParams.get("stage") as Parameters<typeof listQualityChecks>[1];
    const checks = await listQualityChecks(projectId, stage);
    return NextResponse.json({ success: true, data: checks });
  } catch (error) {
    console.error("[api/editorial/quality] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/quality — create a quality check or record a score
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: { type: "check" | "score" } & Record<string, unknown> = await request.json();

    if (body.type === "score") {
      const { project_id, score_type, score, stage, weight, metadata } = body as {
        type: "score";
        project_id: string;
        score_type: string;
        score: number;
        stage?: string;
        weight?: number;
        metadata?: Record<string, unknown>;
      };

      if (!project_id || !score_type || score === undefined) {
        return NextResponse.json(
          { success: false, error: "project_id, score_type and score are required" },
          { status: 400 }
        );
      }

      const saved = await saveQualityScore(project_id, score_type, score, {
        stage: stage as EditorialStage | undefined,
        weight,
        metadata,
      });

      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    }

    // Default: quality check
    const input = body as unknown as CreateQualityCheckInput;
    if (!input.project_id || !input.stage || !input.check_type || !input.check_name) {
      return NextResponse.json(
        { success: false, error: "project_id, stage, check_type and check_name are required" },
        { status: 400 }
      );
    }

    const check = await createQualityCheck(input);
    return NextResponse.json({ success: true, data: check }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/quality] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/quality — resolve a check or recompute overall score
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: {
      action: "resolve_check" | "compute_overall";
      check_id?: string;
      status?: string;
      score?: number;
      details?: Record<string, unknown>;
      project_id?: string;
      score_type?: string;
    } = await request.json();

    if (body.action === "resolve_check") {
      if (!body.check_id || !body.status) {
        return NextResponse.json(
          { success: false, error: "check_id and status are required" },
          { status: 400 }
        );
      }
      const check = await resolveQualityCheck(
        body.check_id,
        body.status as Parameters<typeof resolveQualityCheck>[1],
        body.score,
        body.details
      );
      return NextResponse.json({ success: true, data: check });
    }

    if (body.action === "compute_overall") {
      if (!body.project_id || !body.score_type) {
        return NextResponse.json(
          { success: false, error: "project_id and score_type are required" },
          { status: 400 }
        );
      }
      const score = await computeAndSaveOverallScore(body.project_id, body.score_type);
      return NextResponse.json({ success: true, data: score });
    }

    return NextResponse.json(
      { success: false, error: "action must be 'resolve_check' or 'compute_overall'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/editorial/quality] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
