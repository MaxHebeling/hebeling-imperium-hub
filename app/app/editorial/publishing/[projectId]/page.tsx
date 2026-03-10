import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectPublishingContext } from "@/lib/editorial/publishing/publishing-service";
import { PublishingDashboard } from "@/components/editorial/publishing/publishing-dashboard";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return {
    title: `Publishing | ${projectId} | Hebeling OS`,
  };
}

export default async function PublishingDashboardPage({ params }: Props) {
  const { projectId } = await params;

  // Auth guard — reuse existing session client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) {
    notFound();
  }

  // Load publishing context — all data in one call
  const context = await getProjectPublishingContext(projectId);

  return <PublishingDashboard context={context} projectId={projectId} />;
}
