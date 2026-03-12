import Link from "next/link";
import { getAiDashboard } from "@/lib/editorial/ai";
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

function stageLabel(stage: string | null) {
  if (!stage) return "—";
  return EDITORIAL_STAGE_LABELS[stage as EditorialStageKey] ?? stage;
}

export default async function ReinoEditorialAiPage() {
  const data = await getAiDashboard();

  return (
    <div className="space-y-6 pb-6 px-6 pt-4 min-h-full">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Editorial</h1>
        <p className="text-sm text-muted-foreground">
          Vision global de actividad AI: jobs, findings y backlog de revision editorial.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Jobs en cola
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.jobsQueued}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Jobs en ejecución
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.jobsRunning}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Completados 24h
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.jobsSucceeded24h}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Fallidos 24h
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.kpis.jobsFailed24h}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jobs AI recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentJobs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-sm text-muted-foreground"
                      >
                        No hay jobs AI recientes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentJobs.slice(0, 30).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/app/companies/reino-editorial/projects/${job.project_id}`}
                            className="hover:underline"
                          >
                            {job.project_id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>{stageLabel(job.stage_key)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.job_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleString("es-ES")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Backlog de revisión AI por etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.backlogByStage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay findings AI abiertos pendientes de revisión.
              </p>
            ) : (
              <ul className="space-y-1">
                {data.backlogByStage
                  .slice()
                  .sort((a, b) =>
                    (a.stage_key ?? "").localeCompare(b.stage_key ?? "")
                  )
                  .map((row) => (
                    <li
                      key={row.stage_key ?? "none"}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {stageLabel(row.stage_key)}
                      </span>
                      <Badge
                        variant={
                          row.open_count > 0 ? "default" : "secondary"
                        }
                      >
                        {row.open_count}
                      </Badge>
                    </li>
                  ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Basado en findings AI con estado{" "}
              <span className="font-medium text-foreground">open</span>.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Findings AI recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentFindings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-sm text-muted-foreground"
                    >
                      No hay findings AI recientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentFindings.slice(0, 50).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/app/companies/reino-editorial/projects/${f.project_id}`}
                          className="hover:underline"
                        >
                          {f.project_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{stageLabel(f.stage_key)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            f.severity === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {f.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="capitalize"
                        >
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {f.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleString("es-ES")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

