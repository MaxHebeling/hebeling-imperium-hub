import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getStaffProject } from "@/lib/editorial/staff/services";
import { StaffProjectHeader } from "@/components/editorial/staff/staff-project-header";
import { StaffProjectTabs } from "@/components/editorial/staff/staff-project-tabs";
import { getProjectAlertsWithRecalc } from "@/lib/editorial/alerts/detection";
import { getProjectExports } from "@/lib/editorial/export/services";
import { getProjectDistributions } from "@/lib/editorial/distribution/services";
import type { EditorialProjectAlert } from "@/lib/editorial/alerts/types";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";
import { StaffAlertsPanel } from "@/components/editorial/staff/staff-alerts-panel";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { DeleteEditorialProjectButton } from "@/components/editorial/delete-editorial-project-button";
import { ReinoEditorialManuscriptUpload } from "@/components/editorial/reino-editorial-manuscript-upload";
import { StaffProjectAiReview } from "@/components/editorial/staff/project-ai-review";
import { StaffManuscriptAiCta } from "@/components/editorial/staff/staff-manuscript-ai-cta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ReinoEditorialProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  // Avoid Next.js fetch caching for Supabase reads (critical right after create).
  noStore();

    const { projectId } = await params;

  try {
    const detail = await getStaffProject(projectId);

    if (!detail) {
      return (
        <div className="space-y-6 pb-6 px-6 pt-4">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Proyecto</h1>
            <p className="text-sm text-muted-foreground">
              No hemos encontrado este proyecto en la base de datos.
            </p>
          </header>

          <Card>
            <CardContent className="py-10">
              <StaffEmptyState
                icon={BookOpen}
                title="Proyecto no encontrado"
                description="Puede que el enlace sea incorrecto o que el proyecto haya sido eliminado."
              >
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/app/companies/reino-editorial/projects">Volver a proyectos</Link>
                </Button>
              </StaffEmptyState>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Load additional data independently to avoid one failure breaking the whole page
    const [alerts, exports, distributions] = (await Promise.allSettled([
      getProjectAlertsWithRecalc(projectId),
      getProjectExports(projectId),
      getProjectDistributions(projectId),
    ]).then((results) => [
      (results[0]?.status === "fulfilled" ? results[0].value : []) as EditorialProjectAlert[],
      (results[1]?.status === "fulfilled" ? results[1].value : []) as EditorialExportJob[],
      (results[2]?.status === "fulfilled" ? results[2].value : []) as ProjectDistribution[],
    ])) as [EditorialProjectAlert[], EditorialExportJob[], ProjectDistribution[]];

    const { project, created_by_name, created_by_email, files } = detail;
    const manuscriptFiles = files
      .filter((f) => f.file_type === "manuscript_original")
      .sort((a, b) => b.version - a.version || b.created_at.localeCompare(a.created_at));

    const latestManuscript = manuscriptFiles[0] ?? null;

    return (
      <div className="space-y-6 pb-6 px-6 pt-4">
        <div className="flex flex-col gap-4">
          <StaffProjectHeader
            projectId={project.id}
            title={project.title}
            authorName={project.author_name}
            currentStage={project.current_stage}
            progressPercent={project.progress_percent}
            status={project.status}
            createdByName={created_by_name}
            createdByEmail={created_by_email}
            backHref="/app/companies/reino-editorial/projects"
            backLabel="Volver a proyectos"
          />
          <div className="flex justify-end">
            <DeleteEditorialProjectButton projectId={project.id} />
          </div>
        </div>

        <StaffAlertsPanel projectId={project.id} alerts={alerts} />

        {/* Manuscript section – dedicated uploader for original manuscrito */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Manuscript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sube el manuscrito original para iniciar la ingesta y permitir que el Reino Editorial AI Engine lo procese.
            </p>

            {manuscriptFiles.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 overflow-hidden">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">No hay manuscritos aún.</p>
                  <p className="text-xs text-muted-foreground">
                    Sube el manuscrito original para crear la primera versión y habilitar el AI Review.
                  </p>
                </div>
                <div className="shrink-0">
                  <ReinoEditorialManuscriptUpload projectId={project.id} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Manuscript actual
                    </p>
                    <p className="text-sm text-foreground">
                      Archivo:{" "}
                      <span className="font-medium">
                        {latestManuscript?.storage_path.split("/").pop() ?? "—"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Versión{" "}
                      <span className="font-semibold">
                        v{latestManuscript?.version ?? 1}
                      </span>
                      {" · "}
                      Subido el{" "}
                      {latestManuscript
                        ? new Date(latestManuscript.created_at).toLocaleString("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                      {typeof latestManuscript?.size_bytes === "number" && (
                        <>
                          {" · "}
                          {(latestManuscript.size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <ReinoEditorialManuscriptUpload projectId={project.id} />
                  </div>
                </div>

                <StaffManuscriptAiCta
                  projectId={project.id}
                  hasLatestManuscript={Boolean(latestManuscript)}
                />

                {manuscriptFiles.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Historial de versiones recientes
                    </p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="min-w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium text-muted-foreground">Versión</th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">Archivo</th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">Fecha</th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">Tamaño</th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manuscriptFiles.slice(0, 10).map((file) => {
                            const isCurrent = file.id === latestManuscript?.id;
                            const label = file.storage_path.split("/").pop() ?? file.storage_path;
                            return (
                              <tr key={file.id} className="border-t border-border/60">
                                <td className="px-3 py-2 font-mono text-[11px]">
                                  v{file.version}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="text-xs text-foreground">{label}</span>
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {new Date(file.created_at).toLocaleString("es-ES", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {typeof file.size_bytes === "number"
                                    ? `${(file.size_bytes / (1024 * 1024)).toFixed(2)} MB`
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {isCurrent ? (
                                    <span className="inline-flex rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                      Current
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                      Previous
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Review – análisis editorial automático del manuscrito */}
        <StaffProjectAiReview projectId={project.id} />

        {/* Main dashboard sections: overview, files, activity, AI engine, etc. */}
        <div id="files">
          <StaffProjectTabs detail={detail} exports={exports} distributions={distributions} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[v0] Error in project detail page:", error);
    return (
      <div className="space-y-6 pb-6 px-6 pt-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Error</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error al cargar el proyecto.
          </p>
        </header>

        <Card>
          <CardContent className="py-10">
            <StaffEmptyState
              icon={BookOpen}
              title="Error al cargar"
              description="Por favor intenta nuevamente o contacta al soporte."
            >
              <Button asChild variant="outline" className="gap-2">
                <Link href="/app/companies/reino-editorial/projects">Volver a proyectos</Link>
              </Button>
            </StaffEmptyState>
          </CardContent>
        </Card>
      </div>
    );
  }
}
