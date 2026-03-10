import Link from "next/link";
import { getOperationsDashboard } from "@/lib/editorial/operations/service";
import { listBlockedProjects } from "@/lib/editorial/alerts/detection";
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
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

function stageLabel(stage: string) {
  return EDITORIAL_STAGE_LABELS[stage as EditorialStageKey] ?? stage;
}

export default async function ReinoEditorialOperationsPage() {
  const [data, blocked] = await Promise.all([
    getOperationsDashboard(),
    listBlockedProjects(),
  ]);
  const blockedCount = blocked.length;

  return (
    <div className="space-y-6 pb-6 px-6 pt-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Operaciones</h1>
        <p className="text-sm text-muted-foreground">
          Visión operativa del pipeline: SLA, carga de equipo y atención
          prioritaria.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.projectsTotal}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              En revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.inReview}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              SLA en riesgo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.slaAtRisk}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              SLA vencido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.slaBreached}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Inactividad crítica
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.inactivityCritical}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Pipeline operations board
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {data.pipelineBoard
                .filter((r) => r.stage_status !== "completed")
                .sort((a, b) => a.stage_key.localeCompare(b.stage_key))
                .map((row) => (
                  <div
                    key={`${row.stage_key}:${row.stage_status}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {stageLabel(row.stage_key)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.stage_status}
                        </p>
                      </div>
                      <Badge variant="secondary">{row.stage_count}</Badge>
                    </div>
                    {typeof row.avg_duration_hours === "number" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Duración media: {row.avg_duration_hours.toFixed(1)}h
                      </p>
                    )}
                  </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Nota: esta vista se basa en `editorial_stages` (no incluye aún
              bloqueos/alertas automáticas).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen de alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={blockedCount > 0 ? "destructive" : "secondary"}>
                {blockedCount} bloqueados
              </Badge>
              <Badge variant="outline">Sin cron (recalc on-demand)</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Alertas operativas calculadas server-side. En esta vista se
              muestra el estado de proyectos con alertas bloqueantes abiertas.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Proyectos bloqueados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Bloqueos</TableHead>
                  <TableHead>Tipos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocked.slice(0, 12).map((row) => (
                  <TableRow key={row.project_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/companies/reino-editorial/projects/${row.project_id}`}
                        className="hover:underline"
                      >
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>{stageLabel(row.current_stage)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">
                        {row.blocking_alerts_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(row.open_alert_types ?? [])
                        .slice(0, 3)
                        .join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {blockedCount === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-sm text-muted-foreground"
                    >
                      No hay proyectos bloqueados actualmente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

