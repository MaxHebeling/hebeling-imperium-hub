import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getStaffProject } from "@/lib/editorial/staff/services";
import { StaffProjectHeader } from "@/components/editorial/staff/staff-project-header";
import { getProjectAlertsWithRecalc } from "@/lib/editorial/alerts/detection";
import { getProjectExports } from "@/lib/editorial/export/services";
import { getProjectDistributions } from "@/lib/editorial/distribution/services";
import type { EditorialProjectAlert } from "@/lib/editorial/alerts/types";
import type { EditorialExportJob } from "@/lib/editorial/export/types";
import type { ProjectDistribution } from "@/lib/editorial/distribution/types";
import { StaffAlertsPanel } from "@/components/editorial/staff/staff-alerts-panel";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { DeleteEditorialProjectButton } from "@/components/editorial/delete-editorial-project-button";
import { EditorialPipelineWorkspace } from "@/components/editorial/pipeline/editorial-pipeline-workspace";

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

    const hasManuscript = manuscriptFiles.length > 0;

    return (
      <div className="space-y-6 pb-8 px-8 pt-6">
        {/* Compact header */}
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
            language={project.language}
            genre={project.genre}
            backHref="/app/companies/reino-editorial/projects"
            backLabel="Volver a proyectos"
          />
          <div className="flex justify-end">
            <DeleteEditorialProjectButton projectId={project.id} />
          </div>
        </div>

        {/* Alerts */}
        <StaffAlertsPanel projectId={project.id} alerts={alerts} />

        {/* Single progressive pipeline workspace — replaces all fragmented tabs */}
        <EditorialPipelineWorkspace
          projectId={project.id}
          projectTitle={project.title}
          files={files}
          exports={exports}
          distributions={distributions}
          hasManuscript={hasManuscript}
        />
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
