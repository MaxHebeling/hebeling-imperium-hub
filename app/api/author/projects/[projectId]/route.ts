import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { registerManuscriptFile, logEditorialActivity } from "@/lib/editorial/db/mutations";
import { getLatestFileVersion } from "@/lib/editorial/db/queries";

/**
 * GET /api/author/projects/[projectId]
 *
 * Returns pipeline detail for a project the authenticated user is a member of.
 * - Uses SSR anon-key client for the project + membership check (RLS enforced).
 * - Uses admin client only to fetch visibility-filtered supplementary data
 *   (files, comments, exports) – membership is already verified above.
 *
 * What is NOT returned: internal files, internal comments, jobs, activity logs.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify membership (RLS ensures we only read our own rows)
    const { data: membership, error: memberError } = await supabase
      .from("editorial_project_members")
      .select("role")
      .eq("project_id", projectId)
      .maybeSingle();

    if (memberError) {
      console.error("[author/project] membership error:", memberError.message);
      return NextResponse.json({ success: false, error: "Access check failed" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Fetch project via RLS-respecting client (ep_member_read policy)
    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select(
        "id, title, subtitle, author_name, language, genre, current_stage, status, progress_percent, due_date"
      )
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Use admin client for supplementary data – visibility filters applied manually
    const admin = getAdminClient();

    const [stagesResult, filesResult, commentsResult, exportsResult] =
      await Promise.all([
        admin
          .from("editorial_stages")
          .select("id, stage_key, status, started_at, completed_at, notes")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),

        admin
          .from("editorial_files")
          .select("id, file_type, version, mime_type, size_bytes, visibility, created_at")
          .eq("project_id", projectId)
          .in("visibility", ["client", "public"])
          .order("created_at", { ascending: false }),

        admin
          .from("editorial_comments")
          .select("id, stage_key, comment, visibility, created_at")
          .eq("project_id", projectId)
          .in("visibility", ["client", "public"])
          .order("created_at", { ascending: false }),

        admin
          .from("editorial_exports")
          .select("id, export_type, version, status, created_at")
          .eq("project_id", projectId)
          .eq("status", "ready")
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json({
      success: true,
      project,
      memberRole: membership.role,
      stages: stagesResult.data ?? [],
      files: filesResult.data ?? [],
      comments: commentsResult.data ?? [],
      exports: exportsResult.data ?? [],
    });
  } catch (error) {
    console.error("[author/project] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/author/projects/[projectId]
 *
 * Allows a verified project member (role = author) to upload a new manuscript
 * version. Membership is checked via RLS before storage/DB writes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify membership and role
    const { data: membership } = await supabase
      .from("editorial_project_members")
      .select("role")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (membership.role !== "author") {
      return NextResponse.json(
        { success: false, error: "Only authors can upload manuscripts" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    // Auto-increment version to preserve previous uploads
    const latestVersion = await getLatestFileVersion(projectId, "manuscript_original");
    const nextVersion = latestVersion + 1;

    const { storagePath, sizeBytes, mimeType, version } = await uploadManuscript(
      projectId,
      file,
      nextVersion
    );

    const fileRecord = await registerManuscriptFile(
      projectId,
      storagePath,
      mimeType,
      sizeBytes,
      user.id,
      version,
      "client"
    );

    await logEditorialActivity(projectId, "manuscript_uploaded_by_author", {
      stageKey: "ingesta",
      actorId: user.id,
      actorType: "author",
      payload: { storagePath, sizeBytes, mimeType, version },
    });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("[author/upload] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
