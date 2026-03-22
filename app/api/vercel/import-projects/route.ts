import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  accountId: string;
  link?: {
    type: string;
    repo: string;
    repoId: string | number;
  };
  targets?: {
    production?: {
      alias?: string[];
    };
  };
  latestDeployments?: Array<{
    readyState: string;
    url: string;
  }>;
}

interface VercelProjectsResponse {
  projects: VercelProject[];
  pagination?: {
    next?: number;
  };
}

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Validate environment variables
    const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

    if (!VERCEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "VERCEL_ACCESS_TOKEN is not configured. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    // Get org_id from authenticated user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "User organization not found" },
        { status: 400 }
      );
    }

    const CRM_ORG_ID = profile.org_id;

    // Fetch all projects from Vercel API with pagination support
    const allProjects: VercelProject[] = [];
    let hasMore = true;
    let nextCursor: number | undefined;

    while (hasMore) {
      const url = new URL("https://api.vercel.com/v9/projects");
      if (VERCEL_TEAM_ID) {
        url.searchParams.set("teamId", VERCEL_TEAM_ID);
      }
      if (nextCursor) {
        url.searchParams.set("until", nextCursor.toString());
      }
      url.searchParams.set("limit", "100");

      const vercelResponse = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`,
        },
      });

      if (!vercelResponse.ok) {
        const errorText = await vercelResponse.text();
        return NextResponse.json(
          { error: `Vercel API error: ${errorText}` },
          { status: vercelResponse.status }
        );
      }

      const data: VercelProjectsResponse = await vercelResponse.json();
      allProjects.push(...(data.projects || []));

      // Handle pagination
      if (data.pagination?.next) {
        nextCursor = data.pagination.next;
      } else {
        hasMore = false;
      }
    }

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const project of allProjects) {
      // Get production domain from aliases or targets
      const productionDomain = project.targets?.production?.alias?.[0] || null;
      
      // Build vercel_url
      const vercelUrl = productionDomain 
        ? `https://${productionDomain}` 
        : `https://${project.name}.vercel.app`;

      // Get latest deployment info
      const latestDeployment = project.latestDeployments?.[0];
      const deploymentStatus = latestDeployment?.readyState || null;
      const previewUrl = latestDeployment?.url 
        ? `https://${latestDeployment.url}` 
        : null;

      const projectData = {
        org_id: CRM_ORG_ID,
        vercel_project_id: project.id,
        name: project.name,
        framework: project.framework || null,
        repo_name: project.link?.repo || null,
        repo_url: project.link?.repoId ? String(project.link.repoId) : null,
        production_domain: productionDomain,
        preview_url: previewUrl,
        vercel_url: vercelUrl,
        deployment_status: deploymentStatus,
        account_name: project.accountId || null,
        team_id: VERCEL_TEAM_ID || null,
        metadata: project,
        last_synced_at: new Date().toISOString(),
      };

      // Upsert by vercel_project_id
      const { data: existing } = await supabaseAdmin
        .from("vercel_projects")
        .select("id")
        .eq("vercel_project_id", project.id)
        .single();

      if (existing) {
        // Update existing project
        const { error: updateError } = await supabaseAdmin
          .from("vercel_projects")
          .update({
            ...projectData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(`Error updating project ${project.name}:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Insert new project
        const { error: insertError } = await supabaseAdmin
          .from("vercel_projects")
          .insert(projectData);

        if (insertError) {
          console.error(`Error inserting project ${project.name}:`, insertError);
        } else {
          created++;
        }
      }
      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} projects (${created} created, ${updated} updated)`,
      synced,
      created,
      updated,
      total: allProjects.length,
    });
  } catch (error) {
    console.error("Error importing Vercel projects:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
