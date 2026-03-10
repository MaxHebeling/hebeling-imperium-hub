import Link from "next/link";
import { getOperationsDashboard } from "@/lib/editorial/operations/service";
import { listBlockedProjects } from "@/lib/editorial/alerts/detection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

function stageLabel(stage: string) {
  return EDITORIAL_STAGE_LABELS[stage as EditorialStageKey] ?? stage;
}

function badgeVariantForSla(state: string): "default" | "secondary" | "destructive" | "outline" {
  if (state === "breached") return "destructive";
  if (state === "at_risk") return "default";
  if (state === "on_track") return "secondary";
  return "outline";
}

function badgeVariantForInactivity(state: string): "default" | "secondary" | "destructive" | "outline" {
  if (state === "critical") return "destructive";
  if (state === "at_risk") return "default";
  if (state === "ok") return "secondary";
  return "outline";
}

export default async function StaffOperationsPage() {
  const [data, blocked] = await Promise.all([getOperationsDashboard(), listBlockedProjects()]);
  const blockedCount = blocked.length;

  return (
    <div className="space-y-6 pb-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Operaciones</h2>
        <p className="text-sm text-muted-foreground">
          Visión operativa del pipeline: SLA, carga de equipo y atención prioritaria.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Proyectos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.kpis.projectsTotal}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En revisión</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.kpis.inReview}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SLA en riesgo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.kpis.slaAtRisk}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SLA vencido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.kpis.slaBreached}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Inactividad crítica</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.kpis.inactivityCritical}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline operations board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {data.pipelineBoard
                .filter((r) => r.stage_status !== "completed")
                .sort((a, b) => a.stage_key.localeCompare(b.stage_key))
                .map((row) => (
                  <div key={`${row.stage_key}:${row.stage_status}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{stageLabel(row.stage_key)}</p>
                        <p className="text-xs text-muted-foreground">{row.stage_status}</p>
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
              Nota: esta vista se basa en `editorial_stages` (no incluye aún bloqueos/alertas automáticas).
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
              Alertas operativas calculadas server-side. En esta vista se muestra el estado de proyectos con alertas
              bloqueantes abiertas.
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
                      <Link href={`/staff/books/${row.project_id}`} className="hover:underline">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>{stageLabel(row.current_stage)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{row.blocking_alerts_count}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(row.open_alert_types ?? []).slice(0, 3).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {blockedCount === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      No hay proyectos bloqueados por alertas abiertas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Inactividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.needsAttention
                    .filter((r) => r.sla_state !== "on_track" || r.inactivity_state !== "ok")
                    .slice(0, 12)
                    .map((row) => (
                      <TableRow key={row.project_id}>
                        <TableCell className="font-medium">
                          <Link href={`/staff/books/${row.project_id}`} className="hover:underline">
                            {row.title}
                          </Link>
                        </TableCell>
                        <TableCell>{stageLabel(row.current_stage)}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariantForSla(row.sla_state)} className="capitalize">
                            {row.sla_state}
                          </Badge>
                          {typeof row.days_to_due === "number" && (
                            <span className="ml-2 text-xs text-muted-foreground">{row.days_to_due}d</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={badgeVariantForInactivity(row.inactivity_state)}
                            className="capitalize"
                          >
                            {row.inactivity_state}
                          </Badge>
                          {typeof row.days_since_activity === "number" && (
                            <span className="ml-2 text-xs text-muted-foreground">{row.days_since_activity}d</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {data.needsAttention.filter((r) => r.sla_state !== "on_track" || r.inactivity_state !== "ok").length ===
                    0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        Sin riesgos destacados por SLA o inactividad.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Carga del equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Asignados</TableHead>
                    <TableHead className="text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffWorkload.slice(0, 12).map((row) => (
                    <TableRow key={`${row.user_id}:${row.role}`}>
                      <TableCell className="font-medium">
                        {row.user_name ?? row.user_email ?? row.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="capitalize">{row.role}</TableCell>
                      <TableCell className="text-right">{row.assigned_projects_count}</TableCell>
                      <TableCell className="text-right">{row.review_queue_count}</TableCell>
                    </TableRow>
                  ))}
                  {data.staffWorkload.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        No hay asignaciones de staff registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en `editorial_project_staff_assignments` (Phase 3) + estados de `editorial_projects`.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

