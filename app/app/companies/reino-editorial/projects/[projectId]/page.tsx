import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getStaffProject } from "@/lib/editorial/staff/services";
import { StaffProjectHeader } from "@/components/editorial/staff/staff-project-header";
import { getProjectAlertsWithRecalc } from "@/lib/editorial/alerts/detection";
import type { EditorialProjectAlert } from "@/lib/editorial/alerts/types";
import { StaffAlertsPanel } from "@/components/editorial/staff/staff-alerts-panel";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { DeleteEditorialProjectButton } from "@/components/editorial/delete-editorial-project-button";
import { PipelineVisual13 } from "@/components/editorial/publishing-engine/pipeline-visual-13";
import { ReinoEditorialManuscriptUpload } from "@/components/editorial/reino-editorial-manuscript-upload";

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

    // Load alerts
    let alerts: EditorialProjectAlert[] = [];
    try {
      alerts = await getProjectAlertsWithRecalc(projectId);
    } catch {
      // non-blocking
    }

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

        {/* Manuscript upload section */}
        {!hasManuscript ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">No hay manuscritos aún</p>
                <p className="text-xs text-gray-500">
                  Sube el manuscrito original para iniciar el pipeline editorial con IA.
                </p>
              </div>
              <ReinoEditorialManuscriptUpload projectId={project.id} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-gray-900">
                Manuscrito: {manuscriptFiles[0]?.storage_path?.split("/").pop() ?? "—"}
              </p>
              <p className="text-xs text-gray-500">
                Versión v{manuscriptFiles[0]?.version ?? 1} · {manuscriptFiles.length} archivo(s)
              </p>
            </div>
            <ReinoEditorialManuscriptUpload projectId={project.id} />
          </div>
        )}

        {/* 13-Phase Pipeline Visual — the main editorial engine UI */}
        <PipelineVisual13 projectId={project.id} />
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
