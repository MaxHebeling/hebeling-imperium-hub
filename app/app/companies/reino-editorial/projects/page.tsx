import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getControlCenterData } from "@/lib/editorial/control-center/services";
import {
  Plus,
  FolderOpen,
  FileText,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stageStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-green-200">Completado</Badge>;
    case "in_review":
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En revision</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En proceso</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>;
    default:
      return <Badge variant="secondary">Pendiente</Badge>;
  }
}

export default async function ProjectsListPage() {
  noStore();

  let data;
  try {
    data = await getControlCenterData();
  } catch (error) {
    console.error("[editorial-projects] Error loading data:", error);
    return (
      <div className="min-h-full p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-red-800">Error al cargar proyectos</h2>
          <p className="text-sm text-red-600 mt-1">No se pudieron cargar los datos. Intenta recargar la pagina.</p>
        </div>
      </div>
    );
  }

  const { pipelineProjects } = data;

  return (
    <div
      className="min-h-full pb-8 space-y-6"
      style={{ backgroundColor: "var(--re-bg)" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
              }}
            >
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--re-text)" }}
              >
                Proyectos Editoriales
              </h1>
              <p
                className="text-sm"
                style={{ color: "var(--re-text-muted)" }}
              >
                {pipelineProjects.length} proyecto{pipelineProjects.length !== 1 ? "s" : ""} en el pipeline
              </p>
            </div>
          </div>
          <Link href="/app/companies/reino-editorial/projects/new">
            <Button
              className="gap-2"
              style={{
                background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                color: "white",
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects Table */}
      <section className="px-6">
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base" style={{ color: "var(--re-text)" }}>
              Todos los Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Etapa Actual</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8" style={{ color: "var(--re-text-subtle)" }} />
                          <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                            No hay proyectos en el pipeline editorial.
                          </p>
                          <Link href="/app/companies/reino-editorial/projects/new">
                            <Button variant="outline" size="sm" className="mt-2 gap-2">
                              <Plus className="h-4 w-4" />
                              Crear primer proyecto
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pipelineProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link
                            href={`/app/editorial/projects/${project.id}`}
                            className="font-medium hover:underline text-sm"
                            style={{ color: "var(--re-text)" }}
                          >
                            {project.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                          {project.authorName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: "var(--re-cyan-pale)",
                              color: "var(--re-cyan)",
                              border: "1px solid var(--re-border-cyan)",
                            }}
                          >
                            {project.stageLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: "var(--re-surface-3, #e5e7eb)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${project.progressPercent}%`,
                                  background: "linear-gradient(90deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-semibold w-8 text-right"
                              style={{ color: "var(--re-blue)" }}
                            >
                              {project.progressPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{stageStatusBadge(project.staffReview)}</TableCell>
                        <TableCell className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                          {formatDate(project.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
