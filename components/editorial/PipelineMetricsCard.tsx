"use client";

import { BookOpen, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  EditorialMetrics,
} from "@/types/editorial";
import { EDITORIAL_STAGES, EDITORIAL_STAGE_LABELS, EDITORIAL_STAGE_COLORS } from "@/types/editorial";

interface PipelineMetricsCardProps {
  metrics: EditorialMetrics;
}

export function PipelineMetricsCard({ metrics }: PipelineMetricsCardProps) {
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total libros
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.total_books}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Bloqueados
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">{metrics.blocked_books}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Completados (mes)
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {metrics.completed_this_month}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                En pipeline
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.total_books - metrics.completed_this_month}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Books by stage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Libros por etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {EDITORIAL_STAGES.map((stage) => {
            const count = metrics.books_by_stage[stage] ?? 0;
            const maxCount = Math.max(...Object.values(metrics.books_by_stage), 1);
            const pct = Math.round((count / maxCount) * 100);
            const avgDays = metrics.avg_days_per_stage[stage];

            return (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("h-2.5 w-2.5 rounded-full", EDITORIAL_STAGE_COLORS[stage])}
                    />
                    <span className="font-medium">{EDITORIAL_STAGE_LABELS[stage]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                    {avgDays !== null && (
                      <span>{avgDays}d prom.</span>
                    )}
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      {count}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-500", EDITORIAL_STAGE_COLORS[stage])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Staff workload */}
      {metrics.staff_workload.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Carga del equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.staff_workload.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {(member.full_name ?? member.email ?? "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium">
                    {member.full_name ?? member.email ?? "Usuario"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{member.books_assigned} libro(s)</span>
                  {member.active_checklists > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs h-5 px-1.5 bg-blue-50 text-blue-600 border-blue-200"
                    >
                      {member.active_checklists} activo(s)
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
