import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getControlCenterData } from "@/lib/editorial/control-center/services";
import { getAiDashboard } from "@/lib/editorial/ai/dashboard";
import {
  BookOpen,
  Cpu,
  Eye,
  Rocket,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  FileText,
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

function aiStatusBadge(status: string) {
  switch (status) {
    case "running":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Procesando</Badge>;
    case "queued":
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">En cola</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-green-200">Completado</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>;
    default:
      return <Badge variant="secondary">Inactivo</Badge>;
  }
}

function staffReviewBadge(status: string) {
  switch (status) {
    case "in_review":
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En revisión</Badge>;
    case "approved":
      return <Badge className="bg-green-100 text-green-700 border-green-200">Aprobado</Badge>;
    default:
      return <Badge variant="secondary">Pendiente</Badge>;
  }
}

export default async function ReinoEditorialOverviewPage() {
  noStore();

  let data;
  let aiData;
  try {
    [data, aiData] = await Promise.all([
      getControlCenterData(),
      getAiDashboard(),
    ]);
  } catch (error) {
    console.error("[editorial-control-center] Error loading data:", error);
    return (
      <div className="min-h-full p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-red-800">Error al cargar el Control Center</h2>
          <p className="text-sm text-red-600 mt-1">No se pudieron cargar los datos del dashboard. Intenta recargar la página.</p>
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
        <div className="flex items-center gap-3 mb-1">
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
              Editorial Control Center
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--re-text-muted)" }}
            >
              Panel de control editorial — visibilidad completa del pipeline de producción
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="px-6">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            icon={BookOpen}
            label="Proyectos Activos"
            value={kpis.activeProjects}
            color="blue"
          />
          <KpiCard
            icon={Cpu}
            label="AI Procesando"
            value={kpis.aiProcessing}
            color="purple"
          />
          <KpiCard
            icon={Eye}
            label="Esperando Revisión"
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
            icon={Users}
            label="Revisión Cliente"
            value={kpis.clientReviewStage}
            color="cyan"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Completados (mes)"
            value={kpis.completedThisMonth}
            color="emerald"
          />
        </div>
      </section>

      {/* AI Status Bar */}
      <section className="px-6">
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Zap className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Estado AI en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--re-blue)" }}>
                  {aiData.kpis.jobsQueued}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>En cola</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>
                  {aiData.kpis.jobsRunning}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Ejecutando</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
                  {aiData.kpis.jobsSucceeded24h}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Completados 24h</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                  {aiData.kpis.jobsFailed24h}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Fallidos 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stage Breakdown + Pipeline View */}
      <section className="px-6 grid gap-4 lg:grid-cols-4">
        {/* Stage Breakdown */}
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
          <CardContent className="space-y-2">
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
                  <span className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
                    {stage.stageLabel}
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
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
              <CardTitle className="text-base" style={{ color: "var(--re-text)" }}>
                Project Pipeline View
              </CardTitle>
              <Link
                href="/app/companies/reino-editorial/projects"
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: "var(--re-blue)" }}
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>AI Status</TableHead>
                    <TableHead>Staff Review</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8" style={{ color: "var(--re-text-subtle)" }} />
                          <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                            No hay proyectos en el pipeline editorial.
                          </p>
                          <Link
                            href="/app/companies/reino-editorial/projects"
                            className="text-xs font-medium hover:underline"
                            style={{ color: "var(--re-blue)" }}
                          >
                            Crear primer proyecto
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pipelineProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link
                            href={`/app/companies/reino-editorial/projects/${project.id}`}
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
                        <TableCell>{aiStatusBadge(project.aiStatus)}</TableCell>
                        <TableCell>{staffReviewBadge(project.staffReview)}</TableCell>
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

      {/* AI Findings + Recent Activity */}
      <section className="px-6 grid gap-4 lg:grid-cols-2">
        {/* AI Findings Summary */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              AI Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--re-text)" }}>
                  {aiData.kpis.findingsOpen}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Abiertos</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}>
                <p className="text-xl font-bold text-red-600">
                  {aiData.kpis.findingsCriticalOpen}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Críticos</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}>
                <p className="text-xl font-bold text-amber-600">
                  {aiData.kpis.findingsPendingReview}
                </p>
                <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>Pendientes</p>
              </div>
            </div>
            {aiData.backlogByStage.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
                  Backlog por etapa:
                </p>
                {aiData.backlogByStage.map((row) => (
                  <div
                    key={row.stage_key ?? "none"}
                    className="flex items-center justify-between text-sm px-2 py-1 rounded"
                    style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                  >
                    <span style={{ color: "var(--re-text-muted)" }}>
                      {row.stage_key ?? "Sin etapa"}
                    </span>
                    <Badge variant={row.open_count > 0 ? "default" : "secondary"}>
                      {row.open_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <Link
                href="/app/companies/reino-editorial/ai"
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: "var(--re-blue)" }}
              >
                Ver dashboard AI completo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent AI Jobs */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Clock className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Jobs AI Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiData.recentJobs.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                No hay jobs AI recientes.
              </p>
            ) : (
              <div className="space-y-2">
                {aiData.recentJobs.slice(0, 8).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/app/companies/reino-editorial/projects/${job.project_id}`}
                        className="font-medium truncate hover:underline"
                        style={{ color: "var(--re-text)" }}
                      >
                        {job.project_id.slice(0, 8)}
                      </Link>
                      <span className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                        {job.job_type}
                      </span>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0">
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <Link
                href="/app/companies/reino-editorial/ai"
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: "var(--re-blue)" }}
              >
                Ver todos los jobs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Access Modules */}
      <section className="px-6">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--re-text)" }}
        >
          Módulos del Control Center
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            href="/app/companies/reino-editorial/projects"
            title="Project Workspace"
            description="Vista detallada por libro — metadata, etapas, archivos y actividad"
            icon={BookOpen}
          />
          <ModuleCard
            href="/app/companies/reino-editorial/pipeline"
            title="Editorial Pipeline"
            description="Vista etapa por etapa del pipeline de 8 fases con controles de avance"
            icon={ArrowRight}
          />
          <ModuleCard
            href="/app/companies/reino-editorial/ai"
            title="AI Review Dashboard"
            description="Jobs AI, findings, backlog y métricas de procesamiento"
            icon={Cpu}
          />
          <ModuleCard
            href="/app/companies/reino-editorial/distribution"
            title="Distribución & KDP"
            description="Validación Amazon KDP, paquete de publicación y envío a cliente"
            icon={Rocket}
          />
          <ModuleCard
            href="/app/companies/reino-editorial/operations"
            title="Operaciones"
            description="Contratos, ISBN, metadata legal y página de derechos"
            icon={FileText}
          />
          <ModuleCard
            href="/app/companies/reino-editorial/reports"
            title="Reportes"
            description="Reportes de corrección, comparación de manuscritos y métricas"
            icon={BarChart3}
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */

const KPI_COLOR_CLASSES: Record<string, { icon: string; value: string; iconBg: string }> = {
  blue: { icon: "text-blue-700", value: "text-blue-700", iconBg: "bg-blue-100" },
  purple: { icon: "text-violet-600", value: "text-violet-600", iconBg: "bg-violet-100" },
  orange: { icon: "text-orange-600", value: "text-orange-600", iconBg: "bg-orange-100" },
  green: { icon: "text-green-600", value: "text-green-600", iconBg: "bg-green-100" },
  cyan: { icon: "text-cyan-600", value: "text-cyan-600", iconBg: "bg-cyan-100" },
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

/* ------------------------------------------------------------------ */
/* Module Card                                                         */
/* ------------------------------------------------------------------ */

function ModuleCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-xl p-4 flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full"
        style={{
          backgroundColor: "var(--re-surface)",
          border: "1px solid var(--re-border)",
          boxShadow: "var(--re-shadow-sm, 0 1px 3px rgba(0,0,0,0.06))",
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5"
          style={{
            background: "var(--re-blue-pale, #f0f4ff)",
            border: "1px solid var(--re-border-blue, #1b40c025)",
          }}
        >
          <Icon className="h-4 w-4 text-blue-700" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--re-text)" }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--re-text-muted)" }}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
