import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPublicationVersions } from "@/lib/editorial/publishing/publishing-service";
import { getPublicationMetadata } from "@/lib/editorial/publishing/metadata-service";
import { MetadataForm } from "@/components/editorial/publishing/metadata-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Metadatos | ${projectId} | Hebeling OS` };
}

export default async function MetadataPage({ params }: Props) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["superadmin", "admin", "ops"].includes(profile.role)) notFound();

  const versions = await listPublicationVersions(projectId);
  const latestVersion = versions[0] ?? null;

  const metadata = latestVersion
    ? await getPublicationMetadata(latestVersion.id)
    : null;

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
        <h1 className="text-2xl font-semibold tracking-tight">Metadatos editoriales</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Información bibliográfica y comercial para distribución.
        </p>
      </div>

      <Separator />

      {/* No versions */}
      {!latestVersion && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin versión de publicación</p>
            <p className="text-sm mt-1">
              Los metadatos se asocian a una versión de publicación. Crea una primero.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metadata form */}
      {latestVersion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Metadatos de publicación</CardTitle>
                <CardDescription className="mt-1">
                  Vinculados a la versión{" "}
                  <Badge variant="outline" className="font-mono text-xs ml-1">
                    {latestVersion.version_tag}
                  </Badge>
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  latestVersion.status === "ready"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700"
                }
              >
                {latestVersion.status === "ready" ? "Lista" : latestVersion.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MetadataForm
              publicationVersionId={latestVersion.id}
              projectId={projectId}
              initial={metadata}
            />
          </CardContent>
        </Card>
      )}

      {/* Version list — picker for future multi-version metadata */}
      {versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Otras versiones ({versions.length - 1})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.slice(1).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <span className="font-medium">{v.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{v.version_tag}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{v.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
