import Link from "next/link";
import { getStaffDashboard } from "@/lib/editorial/staff/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { BookMarked } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Staff Dashboard — Panel principal con datos reales del pipeline.
 * Reutiliza: getStaffDashboard() → listEditorialProjects + calculateProgressPercent.
 */
export default async function StaffDashboardPage() {
  const data = await getStaffDashboard();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Panel</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vista general del pipeline editorial.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proyectos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.projectsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.inReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados (mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.completedThisMonthCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <CardDescription>
            Proyectos con última actividad reciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentProjects.length === 0 ? (
            <StaffEmptyState
              icon={BookMarked}
              title="Sin actividad reciente"
              description="Cuando haya proyectos en el pipeline, aparecerán aquí ordenados por última actividad."
            />
          ) : (
            <ul className="space-y-3">
              {data.recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/staff/books/${p.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        {p.author_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.author_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.last_activity_at
                            ? formatDate(p.last_activity_at)
                            : formatDate(p.created_at)}
                          {p.created_by_name && (
                            <> · {p.created_by_name}</>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary">
                          {EDITORIAL_STAGE_LABELS[p.current_stage as EditorialStageKey] ?? p.current_stage}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={p.progress_percent}
                            className="h-1.5 w-16"
                          />
                          <span className="text-xs text-muted-foreground">
                            {p.progress_percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
