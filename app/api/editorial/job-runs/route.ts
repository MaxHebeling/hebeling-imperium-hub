import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createJobRun,
  startJobRun,
  completeJobRun,
  listJobRunsForProject,
} from "@/lib/editorial/job-runs";
import { auditAiAction } from "@/lib/editorial/audit";
import type { CreateJobRunInput, CompleteJobRunInput } from "@/types/editorial";

// GET /api/editorial/job-runs?project_id=... — list runs for a project
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

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "project_id query param is required" },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const runs = await listJobRunsForProject(projectId, limit);

    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    console.error("[api/editorial/job-runs] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/job-runs — create a new job run
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

    const body: CreateJobRunInput = await request.json();

    if (!body.project_id || !body.stage) {
      return NextResponse.json(
        { success: false, error: "project_id and stage are required" },
        { status: 400 }
      );
    }

    const run = await createJobRun({ ...body, initiated_by: user.id });

    await auditAiAction(profile.org_id, "job_run", run.id, "created", {
      project_id: run.project_id,
      stage: run.stage,
    });

    return NextResponse.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/job-runs] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/job-runs — update run status (start or complete)
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

    const body: { action: "start" | "complete" } & CompleteJobRunInput = await request.json();

    if (!body.run_id) {
      return NextResponse.json(
        { success: false, error: "run_id is required" },
        { status: 400 }
      );
    }

    if (body.action === "start") {
      const run = await startJobRun(body.run_id);
      return NextResponse.json({ success: true, data: run });
    }

    if (body.action === "complete") {
      if (!body.status) {
        return NextResponse.json(
          { success: false, error: "status is required when completing a run" },
          { status: 400 }
        );
      }
      const run = await completeJobRun(body);

      await auditAiAction(profile.org_id, "job_run", body.run_id, `completed_${body.status}`, {
        input_tokens: run.input_tokens,
        output_tokens: run.output_tokens,
        cost_usd: run.cost_usd,
        duration_ms: run.duration_ms,
      });

      return NextResponse.json({ success: true, data: run });
    }

    return NextResponse.json(
      { success: false, error: "action must be 'start' or 'complete'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/editorial/job-runs] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
