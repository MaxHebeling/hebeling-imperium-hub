import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin configuration is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const ORG_ID = process.env.ORG_ID || "c9d2af49-8ca2-45b6-a9b3-f6e33b77c3a7";

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  link?: {
    type: string;
    repo: string;
  };
  targets?: {
    production?: {
      url: string;
    };
  };
  latestDeployments?: Array<{
    readyState: string;
    url: string;
  }>;
}

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!VERCEL_TOKEN) {
      return NextResponse.json(
        { error: "VERCEL_TOKEN not configured" },
        { status: 500 }
      );
    }

    // Fetch projects from Vercel API
    const vercelResponse = await fetch("https://api.vercel.com/v9/projects", {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!vercelResponse.ok) {
      const error = await vercelResponse.text();
      return NextResponse.json(
        { error: `Vercel API error: ${error}` },
        { status: vercelResponse.status }
      );
    }

    const data = await vercelResponse.json();
    const projects: VercelProject[] = data.projects || [];

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const project of projects) {
      // Check if website already exists by vercel_project_id
      const { data: existing } = await supabaseAdmin
        .from("websites")
        .select("id")
        .eq("vercel_project_id", project.id)
        .single();

      const productionUrl = project.targets?.production?.url 
        ? `https://${project.targets.production.url}`
        : null;

      const latestDeployment = project.latestDeployments?.[0];
      const deploymentStatus = latestDeployment?.readyState || "unknown";
      const previewUrl = latestDeployment?.url 
        ? `https://${latestDeployment.url}` 
        : null;

      const websiteData = {
        name: project.name,
        primary_domain: productionUrl || `${project.name}.vercel.app`,
        vercel_project_id: project.id,
        framework: project.framework,
        repo_name: project.link?.repo || null,
        deployment_status: deploymentStatus,
        preview_url: previewUrl,
        last_synced_at: new Date().toISOString(),
        org_id: ORG_ID,
      };

      if (existing) {
        // Update existing website
        await supabaseAdmin
          .from("websites")
          .update(websiteData)
          .eq("id", existing.id);
        updated++;
      } else {
        // Create new website
        await supabaseAdmin
          .from("websites")
          .insert(websiteData);
        created++;
      }
      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} projects (${created} created, ${updated} updated)`,
      synced,
      created,
      updated,
    });
  } catch (error) {
    console.error("Error syncing Vercel projects:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
