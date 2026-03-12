import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getStaffProject } from "@/lib/editorial/staff/services";
import { StaffProjectHeader } from "@/components/editorial/staff/staff-project-header";
import { StaffProjectTabs } from "@/components/editorial/staff/staff-project-tabs";
import { getProjectAlertsWithRecalc } from "@/lib/editorial/alerts/detection";
import { getProjectExports } from "@/lib/editorial/export/services";
import { getProjectDistributions } from "@/lib/editorial/distribution/services";
import { StaffAlertsPanel } from "@/components/editorial/staff/staff-alerts-panel";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload } from "lucide-react";
import { DeleteEditorialProjectButton } from "@/components/editorial/delete-editorial-project-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectDetailPageProps {
  params?: { projectId?: string };
}

export default async function ReinoEditorialProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  // Avoid Next.js fetch caching for Supabase reads (critical right after create).
  noStore();

  const rawProjectId =
    typeof params?.projectId === "string" ? params.projectId : "";
  const projectId = rawProjectId.trim();

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
    const [alerts, exports, distributions] = await Promise.allSettled([
      getProjectAlertsWithRecalc(projectId),
      getProjectExports(projectId),
      getProjectDistributions(projectId),
    ]).then((results) => [
      results[0]?.status === "fulfilled" ? results[0].value : [],
      results[1]?.status === "fulfilled" ? results[1].value : [],
      results[2]?.status === "fulfilled" ? results[2].value : [],
    ]);

    const { project, created_by_name, created_by_email, files } = detail;
    const manuscriptFiles = files.filter((f) => f.file_type === "manuscript_original");

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

        {/* Manuscript section – visible placeholder, ready for uploader wiring */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Manuscript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sube el manuscrito original para iniciar la ingesta y permitir que el Reino Editorial AI Engine lo procese.
            </p>
            {manuscriptFiles.length === 0 ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">No manuscript uploaded yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Cuando lo subas, se registrará en "Files" y se podrán encolar jobs de AI.
                  </p>
                </div>
                <Button asChild className="gap-2 shrink-0">
                  {/* Ancla a la sección de Files donde ya existe el uploader real */}
                  <Link href="#files">
                    <Upload className="h-4 w-4" />
                    Upload Manuscript
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-foreground">
                  Manuscrito subido:{" "}
                  <span className="font-medium">{manuscriptFiles[0]?.storage_path ?? "—"}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
