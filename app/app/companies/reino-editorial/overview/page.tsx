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
  BookOpen,
  Eye,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  FileText,
  Plus,
  FolderOpen,
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

export default async function ReinoEditorialOverviewPage() {
  noStore();

  let data;
  try {
    data = await getControlCenterData();
  } catch (error) {
    console.error("[editorial-control-center] Error loading data:", error);
    return (
      <div className="min-h-full p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-red-800">Error al cargar el Panel</h2>
          <p className="text-sm text-red-600 mt-1">No se pudieron cargar los datos. Intenta recargar la pagina.</p>
        </div>
      </div>
    );
  }

  const { kpis, pipelineProjects, stageBreakdown } = data;

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
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--re-text)" }}
              >
                Panel Editorial
              </h1>
              <p
                className="text-sm"
                style={{ color: "var(--re-text-muted)" }}
              >
                Pipeline de produccion editorial — 11 etapas
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

      {/* KPI Cards */}
      <section className="px-6">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard
            icon={BookOpen}
            label="Proyectos Activos"
            value={kpis.activeProjects}
            color="blue"
          />
          <KpiCard
            icon={Eye}
            label="Esperando Revision"
            value={kpis.awaitingReview}
            color="orange"
          />
          <KpiCard
            icon={Rocket}
            label="Listo p/ Publicar"
            value={kpis.readyForPublishing}
            color="green"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Completados (mes)"
            value={kpis.completedThisMonth}
            color="emerald"
          />
        </div>
      </section>

      {/* Stage Breakdown + Pipeline View */}
      <section className="px-6 grid gap-4 lg:grid-cols-4">
        {/* Stage Breakdown - 11 Etapas */}
        <Card
          className="lg:col-span-1"
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base" style={{ color: "var(--re-text)" }}>
              Pipeline por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stageBreakdown.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                Sin proyectos activos en el pipeline.
              </p>
            ) : (
              stageBreakdown.map((stage) => (
                <div
                  key={stage.stageKey}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                  style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                >
                  <span className="text-xs font-medium truncate" style={{ color: "var(--re-text)" }}>
                    {stage.stageLabel}
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: "var(--re-blue)" }}
                  >
                    {stage.projectCount}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Project Pipeline Table */}
        <Card
          className="lg:col-span-3"
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
                <FolderOpen className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
                Proyectos en Pipeline
              </CardTitle>
            </div>
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

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */

const KPI_COLOR_CLASSES: Record<string, { icon: string; value: string; iconBg: string }> = {
  blue: { icon: "text-blue-700", value: "text-blue-700", iconBg: "bg-blue-100" },
  orange: { icon: "text-orange-600", value: "text-orange-600", iconBg: "bg-orange-100" },
  green: { icon: "text-green-600", value: "text-green-600", iconBg: "bg-green-100" },
  emerald: { icon: "text-emerald-600", value: "text-emerald-600", iconBg: "bg-emerald-100" },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  const c = KPI_COLOR_CLASSES[color] ?? KPI_COLOR_CLASSES.blue;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--re-surface)",
        border: "1px solid var(--re-border)",
        boxShadow: "var(--re-shadow-sm, 0 1px 3px rgba(0,0,0,0.06))",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${c.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.value}`}>
        {value}
      </p>
      <p
        className="text-xs font-medium"
        style={{ color: "var(--re-text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}
