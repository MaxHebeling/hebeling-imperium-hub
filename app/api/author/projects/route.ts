import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/author/projects
 *
 * Returns editorial projects where the authenticated user is a member
 * (via editorial_project_members). Uses the SSR anon-key client so RLS
 * applies automatically – no service role key is exposed.
 *
 * RLS prerequisite (migration 011):
 *   - editorial_project_members: user can SELECT rows where user_id = auth.uid()
 *   - editorial_projects: user can SELECT rows where they appear in epm
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch member rows for this user (RLS restricts to own rows)
    const { data: memberships, error: memberError } = await supabase
      .from("editorial_project_members")
      .select("project_id, role, invited_at, accepted_at");

    if (memberError) {
      console.error("[author/projects] membership fetch error:", memberError.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch memberships" },
        { status: 500 }
      );
    }

    const projectIds = (memberships ?? []).map((m) => m.project_id);

    if (projectIds.length === 0) {
      return NextResponse.json({ success: true, projects: [] });
    }

    // Fetch projects – RLS ep_member_read policy ensures we only see our own
    const { data: projects, error: projectError } = await supabase
      .from("editorial_projects")
      .select(
        "id, title, subtitle, author_name, current_stage, status, progress_percent, due_date, created_at"
      )
      .in("id", projectIds)
      .order("created_at", { ascending: false });

    if (projectError) {
      console.error("[author/projects] project fetch error:", projectError.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Merge membership role into each project for display
    const membershipMap = new Map(
      (memberships ?? []).map((m) => [m.project_id, m])
    );

    const enriched = (projects ?? []).map((p) => ({
      ...p,
      membership: membershipMap.get(p.id) ?? null,
    }));

    return NextResponse.json({ success: true, projects: enriched });
  } catch (error) {
    console.error("[author/projects] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
