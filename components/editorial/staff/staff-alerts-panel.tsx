"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EditorialProjectAlert } from "@/lib/editorial/alerts/types";
import { toast } from "@/components/ui/use-toast";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "open") return "destructive";
  if (status === "acknowledged") return "default";
  if (status === "resolved") return "secondary";
  return "outline";
}

function severityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "default";
  if (severity === "info") return "secondary";
  return "outline";
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierta",
  acknowledged: "Reconocida",
  resolved: "Resuelta",
};

const TYPE_LABELS: Record<string, string> = {
  missing_assignment: "Asignación faltante",
  missing_required_file: "Archivo requerido faltante",
  checklist_incomplete: "Checklist incompleto",
  critical_rule_failed: "Regla crítica fallida",
  inactivity_risk: "Riesgo por inactividad",
  sla_risk: "Riesgo SLA",
};

export function StaffAlertsPanel({
  projectId,
  alerts,
  title = "Alertas operativas",
}: {
  projectId: string;
  alerts: EditorialProjectAlert[];
  title?: string;
}) {
  const [items, setItems] = useState(alerts);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCount = useMemo(() => items.filter((a) => a.status === "open").length, [items]);
  const blockingOpenCount = useMemo(
    () => items.filter((a) => a.status === "open" && a.is_blocking).length,
    [items]
  );

  const recalc = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/staff/projects/${projectId}/alerts/recalculate`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "No se pudo recalcular alertas");
        }
        setItems(json.alerts as EditorialProjectAlert[]);
        toast({ title: "Alertas actualizadas" });
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudo recalcular alertas",
          variant: "destructive",
        });
      }
    });
  };

  const updateStatus = (alertId: string, status: "open" | "acknowledged" | "resolved") => {
    startTransition(async () => {
      setBusyId(alertId);
      try {
        const res = await fetch(`/api/staff/projects/${projectId}/alerts/${alertId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "No se pudo actualizar el estado");
        }
        setItems((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)));
        toast({ title: "Estado actualizado" });
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudo actualizar el estado",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {openCount} abiertas · {blockingOpenCount} bloqueantes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={recalc} disabled={isPending}>
            Recalcular
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin alertas registradas.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {TYPE_LABELS[a.alert_type] ?? a.alert_type}
                      {a.is_blocking && (
                        <span className="ml-2 text-xs text-muted-foreground">(bloqueante)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant(String(a.severity))}>
                      {String(a.severity)}
                    </Badge>
                    <Badge variant={statusVariant(String(a.status))}>
                      {STATUS_LABELS[String(a.status)] ?? String(a.status)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {a.status !== "acknowledged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(a.id, "acknowledged")}
                      disabled={isPending || busyId === a.id}
                    >
                      Reconocer
                    </Button>
                  )}
                  {a.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(a.id, "resolved")}
                      disabled={isPending || busyId === a.id}
                    >
                      Resolver
                    </Button>
                  )}
                  {a.status !== "open" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(a.id, "open")}
                      disabled={isPending || busyId === a.id}
                    >
                      Reabrir
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

