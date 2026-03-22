import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReinoEditorialProjectRedirect({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/editorial/projects/${projectId}`);
}
