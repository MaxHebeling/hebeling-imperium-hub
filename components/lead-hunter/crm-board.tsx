import Link from "next/link";
import { ArrowUpRight, ClipboardList, TimerReset, UserRound } from "lucide-react";

import type { PermitHunterCrmBoardData } from "@/lib/lead-hunter/permit-hunter-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LeadHunterCrmBoard({
  board,
}: {
  board: PermitHunterCrmBoardData;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
        {board.stageCounts.map((item) => (
          <Card
            key={item.stage}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]"
          >
            <div className="h-px bg-[#C96F2D]" />
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
          <div className="h-px bg-[#C96F2D]" />
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Sales Board</CardTitle>
            <CardDescription className="text-muted-foreground">
              Pipeline comercial de permisos frescos a deals activos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-4">
              {board.lanes.map((lane) => (
                <div
                  key={lane.stage}
                  className="rounded-xl border border-border/70 bg-background/60 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {lane.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{lane.leads.length} visibles</p>
                    </div>
                    <Badge variant="secondary">{lane.leads.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {lane.leads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay leads en esta etapa.
                      </p>
                    ) : (
                      lane.leads.map((item) => (
                        <Link
                          key={item.lead.permitNumber}
                          href={`/app/companies/lead-hunter/leads/${encodeURIComponent(item.lead.permitNumber)}`}
                          className="block rounded-xl border border-border/60 bg-card/90 p-3 transition hover:border-[#C96F2D]/40 hover:bg-card"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {item.lead.address}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.lead.permitNumber} · {item.lead.rawStatus}
                          </p>
                          {item.lead.scopeOfWork ? (
                            <p className="mt-2 line-clamp-3 text-xs leading-6 text-muted-foreground">
                              {item.lead.scopeOfWork}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#E1A24A] hover:bg-[#C96F2D]/10">
                              Score {item.lead.score}
                            </Badge>
                            <Badge variant="secondary">{item.crm.priority}</Badge>
                            <Badge variant="secondary">{item.taskCount} tareas</Badge>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
            <div className="h-px bg-[#C96F2D]" />
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Task Queue</CardTitle>
              <CardDescription className="text-muted-foreground">
                Tareas activas cruzadas sobre los deals vigentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Open tasks
                    </p>
                    <ClipboardList className="h-4 w-4 text-[#E1A24A]" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {board.metrics.openTasks}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Overdue
                    </p>
                    <TimerReset className="h-4 w-4 text-[#E1A24A]" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {board.metrics.overdueTasks}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Unassigned
                    </p>
                    <UserRound className="h-4 w-4 text-[#E1A24A]" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {board.metrics.unassignedLeads}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {board.dueTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay tareas activas.</p>
                ) : (
                  board.dueTasks.map((item) => (
                    <Link
                      key={item.task.id}
                      href={`/app/companies/lead-hunter/leads/${encodeURIComponent(item.lead.permitNumber)}`}
                      className="block rounded-xl border border-border/60 bg-background/60 p-4 transition hover:border-[#C96F2D]/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.task.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.lead.address} · {item.crm.stage.replaceAll("_", " ")}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {item.task.dueAt
                              ? `Vence ${new Date(item.task.dueAt).toLocaleString()}`
                              : "Sin fecha límite"}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 h-4 w-4 text-[#E1A24A]" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
            <div className="h-px bg-[#C96F2D]" />
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Assignees</CardTitle>
              <CardDescription className="text-muted-foreground">
                Distribución de carga por operador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {board.assignees.map((assignee) => (
                <div
                  key={assignee.name}
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{assignee.name}</p>
                    <p className="text-sm text-muted-foreground">{assignee.leadCount} leads</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {assignee.taskCount} tareas abiertas
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
