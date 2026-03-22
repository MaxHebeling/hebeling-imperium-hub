import { createClient } from "@/lib/supabase/server";
import { OrganizationsContent } from "@/components/organizations-content";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  plan: string;
  members_count: number;
  created_at: string;
}

interface OrganizationRow extends Omit<Organization, "members_count"> {
  organization_members?: Array<{ count: number | null }> | null;
}

async function getOrganizations(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug,
      description,
      status,
      plan,
      created_at,
      organization_members(count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }

  return ((orgs ?? []) as OrganizationRow[]).map((org) => ({
    ...org,
    members_count: org.organization_members?.[0]?.count || 0,
  })) as Organization[];
}

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const organizations = await getOrganizations(supabase);

  return <OrganizationsContent organizations={organizations} />;
}
