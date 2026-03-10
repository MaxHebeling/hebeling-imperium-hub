import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createPromptVersion,
  approvePromptVersion,
} from "@/lib/editorial/prompts";
import type { CreatePromptVersionInput, ApprovePromptVersionInput } from "@/types/editorial";
import { auditUpdated } from "@/lib/editorial/audit";

// GET /api/editorial/prompt-versions?template_id=... — list versions for a template
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
    const templateId = searchParams.get("template_id");

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "template_id query param is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("editorial_ai_prompt_versions")
      .select("*")
      .eq("prompt_template_id", templateId)
      .order("version_number", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[api/editorial/prompt-versions] GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST /api/editorial/prompt-versions — submit a new draft version
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

    if (!profile || !["superadmin", "admin"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: CreatePromptVersionInput = await request.json();

    if (!body.prompt_template_id || !body.prompt_text) {
      return NextResponse.json(
        { success: false, error: "prompt_template_id and prompt_text are required" },
        { status: 400 }
      );
    }

    const version = await createPromptVersion({ ...body, submitted_by: user.id });

    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (error) {
    console.error("[api/editorial/prompt-versions] POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH /api/editorial/prompt-versions — approve or reject a version
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

    if (!profile || !["superadmin", "admin"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body: ApprovePromptVersionInput & { action: "approve" | "reject"; reason?: string } =
      await request.json();

    if (!body.version_id || !body.action) {
      return NextResponse.json(
        { success: false, error: "version_id and action are required" },
        { status: 400 }
      );
    }

    if (body.action === "approve") {
      const approved = await approvePromptVersion({
        version_id: body.version_id,
        reviewed_by: user.id,
        review_notes: body.review_notes,
      });

      await auditUpdated(
        profile.org_id,
        "prompt_version",
        body.version_id,
        { status: "pending_approval" },
        { status: "approved", reviewed_by: user.id },
        user.id
      );

      return NextResponse.json({ success: true, data: approved });
    }

    if (body.action === "reject") {
      const { data, error } = await supabase
        .from("editorial_ai_prompt_versions")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: body.review_notes ?? body.reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.version_id)
        .select()
        .single();

      if (error) throw error;

      await auditUpdated(
        profile.org_id,
        "prompt_version",
        body.version_id,
        { status: "pending_approval" },
        { status: "rejected", reviewed_by: user.id },
        user.id
      );

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/editorial/prompt-versions] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
