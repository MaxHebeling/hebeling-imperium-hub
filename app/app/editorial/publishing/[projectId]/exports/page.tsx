import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPublicationVersions } from "@/lib/editorial/publishing/publishing-service";
import { listProjectExportRuns } from "@/lib/editorial/publishing/export-service";
import { validatePublishingReadiness } from "@/lib/editorial/publishing/publishing-validation-service";
import { getPublicationMetadata } from "@/lib/editorial/publishing/metadata-service";
import { ExportHistoryTable } from "@/components/editorial/publishing/export-history-table";
import { ExportActions } from "@/components/editorial/publishing/export-actions";
import { DistributionReadinessPanel } from "@/components/editorial/publishing/distribution-readiness-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Exportaciones | ${projectId} | Hebeling OS` };
}

export default async function ExportsPage({ params }: Props) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) notFound();

  // Data fetching
  const [versions, exportRuns] = await Promise.all([
    listPublicationVersions(projectId),
    listProjectExportRuns(projectId, 100),
  ]);

  const latestVersion = versions[0] ?? null;
  const latestMetadata = latestVersion
    ? await getPublicationMetadata(latestVersion.id)
    : null;
  const readiness = await validatePublishingReadiness(projectId, latestVersion, latestMetadata);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/app/editorial/publishing/${projectId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al panel de publicación
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Exportaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Genera y descarga las salidas editoriales del manuscrito.
        </p>
      </div>

      <Separator />

      {/* Readiness */}
      <DistributionReadinessPanel readiness={readiness} />

      {/* Trigger export */}
      {latestVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva exportación</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportActions
              projectId={projectId}
              publicationVersion={latestVersion}
              readyToExport={readiness.ready}
              blockers={readiness.blockers}
            />
          </CardContent>
        </Card>
      )}

      {/* No versions */}
      {!latestVersion && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <p className="font-medium">Sin versiones de publicación</p>
            <p className="text-sm mt-1">Crea una versión antes de exportar.</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href={`/app/editorial/publishing/${projectId}`}>
                Ir al panel de publicación
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Export history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de exportaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportHistoryTable exports={exportRuns} />
        </CardContent>
      </Card>
    </div>
  );
}
