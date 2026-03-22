import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify the requesting user is authenticated (staff/admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    // Fetch all profiles (portal clients) from the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, org_id, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      // If profiles table doesn't exist, try fetching from editorial_projects client_ids
      const { data: projects, error: projectsError } = await supabase
        .from("editorial_projects")
        .select("client_id, title, current_stage, status, created_at")
        .not("client_id", "is", null)
        .order("created_at", { ascending: false });

      if (projectsError) {
        return NextResponse.json({
          success: true,
          clients: [],
          source: "no_data",
        });
      }

      // Group by client_id
      const clientMap = new Map<string, { client_id: string; projects: typeof projects }>();
      for (const p of projects ?? []) {
        const cid = p.client_id as string;
        if (!clientMap.has(cid)) {
          clientMap.set(cid, { client_id: cid, projects: [] });
        }
        clientMap.get(cid)!.projects.push(p);
      }

      const clients = Array.from(clientMap.values()).map((c) => ({
        id: c.client_id,
        email: null,
        full_name: null,
        projects_count: c.projects.length,
        last_project: c.projects[0]?.title ?? null,
        last_project_stage: c.projects[0]?.current_stage ?? null,
        last_project_status: c.projects[0]?.status ?? null,
        created_at: c.projects[c.projects.length - 1]?.created_at ?? null,
      }));

      return NextResponse.json({ success: true, clients, source: "projects" });
    }

    // Enrich profiles with project counts
    const profileIds = (profiles ?? []).map((p) => p.id);

    const projectCounts: Record<string, number> = {};
    if (profileIds.length > 0) {
      const { data: projects } = await supabase
        .from("editorial_projects")
        .select("client_id")
        .in("client_id", profileIds);

      if (projects) {
        for (const p of projects) {
          const cid = p.client_id as string;
          projectCounts[cid] = (projectCounts[cid] ?? 0) + 1;
        }
      }
    }

    const clients = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      org_id: p.org_id,
      role: p.role,
      projects_count: projectCounts[p.id] ?? 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return NextResponse.json({ success: true, clients, source: "profiles" });
  } catch (err) {
    console.error("Error fetching portal clients:", err);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
