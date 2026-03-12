"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type { EditorialAiFinding } from "@/lib/editorial/types/ai-findings";

const TASK_LABELS: Record<string, string> = {
  structure_analysis: "Análisis de estructura",
  style_suggestions: "Sugerencias de estilo",
  orthotypography_review: "Revisión ortotipográfica",
  issue_detection: "Detección de issues",
  quality_scoring: "Quality scoring",
  redline_diff: "Diff/redline",
};

function severityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "default";
  if (severity === "info") return "secondary";
  return "outline";
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "resolved") return "secondary";
  if (status === "acknowledged") return "default";
  if (status === "dismissed") return "outline";
  return "outline";
}

export function AiStageAssistPanel({
  projectId,
  stageKey,
  tasks,
}: {
  projectId: string;
  stageKey: EditorialStageKey;
  tasks: EditorialAiTaskKey[];
}) {
  const [isPending, startTransition] = useTransition();
  const [findings, setFindings] = useState<EditorialAiFinding[]>([]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    for (const f of findings) {
      if (f.severity === "critical") c.critical += 1;
      else if (f.severity === "warning") c.warning += 1;
      else c.info += 1;
    }
    return c;
  }, [findings]);

  const refreshFindings = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/staff/projects/${projectId}/stages/${stageKey}/ai/findings`, {
          method: "GET",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "No se pudieron cargar findings");
        }
        setFindings((json.findings ?? []) as EditorialAiFinding[]);
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudieron cargar findings",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    refreshFindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, stageKey]);

  const runTask = (taskKey: EditorialAiTaskKey) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/staff/projects/${projectId}/stages/${stageKey}/ai/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskKey }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "No se pudo crear el job AI");
        }
        toast({
          title: "Job AI solicitado",
          description: `Job: ${json.jobId}`,
        });
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudo crear el job AI",
          variant: "destructive",
        });
      }
    });
  };

  const decide = (findingId: string, decisionStatus: string, comment?: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/${stageKey}/ai/findings/${findingId}/decision`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decisionStatus, comment: comment ?? null }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "No se pudo registrar la decisión");
        }
        toast({
          title: "Decisión registrada",
          description: `Estado del finding: ${json.findingStatus}`,
        });
        refreshFindings();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudo registrar la decisión",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">AI – Asistencia por etapa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Findings:{" "}
              <span className="font-medium text-foreground">{findings.length}</span>
              <span className="ml-2 inline-flex items-center gap-2">
                <Badge variant="destructive">{counts.critical} crítico</Badge>
                <Badge variant="default">{counts.warning} warning</Badge>
                <Badge variant="secondary">{counts.info} info</Badge>
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshFindings} disabled={isPending}>
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tasks.map((taskKey) => (
            <Button
              key={taskKey}
              size="sm"
              variant="outline"
              onClick={() => runTask(taskKey)}
              disabled={isPending}
              className="h-8"
            >
              {TASK_LABELS[taskKey] ?? taskKey}
            </Button>
          ))}
        </div>

        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay findings AI para esta etapa todavía. Ejecuta un job y revisa los resultados cuando estén listos.
          </p>
        ) : (
          <ul className="space-y-2">
            {findings.slice(0, 6).map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant(String(f.severity))}>{String(f.severity)}</Badge>
                    <Badge variant="outline">{String(f.finding_type)}</Badge>
                    <Badge variant={statusVariant(String(f.status))}>{String(f.status)}</Badge>
                  </div>
                </div>
                {f.suggested_action && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Acción sugerida: {f.suggested_action}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => decide(f.id, "accepted")}
                    disabled={isPending}
                  >
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => decide(f.id, "rejected")}
                    disabled={isPending}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => decide(f.id, "resolved")}
                    disabled={isPending}
                  >
                    Marcar resuelto
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => decide(f.id, "applied_manually")}
                    disabled={isPending}
                  >
                    Aplicado manualmente
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

