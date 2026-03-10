"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { PublishingReadinessResult } from "@/types/editorial";

interface DistributionReadinessPanelProps {
  readiness: PublishingReadinessResult;
}

const CHECK_LABELS: Record<keyof PublishingReadinessResult["checks"], string> = {
  stage_is_final: "Etapa final alcanzada",
  no_open_critical_findings: "Sin findings críticos abiertos",
  metadata_complete: "Metadatos completos",
  has_approved_version: "Versión aprobada disponible",
};

export function DistributionReadinessPanel({ readiness }: DistributionReadinessPanelProps) {
  const passedCount = Object.values(readiness.checks).filter(Boolean).length;
  const totalCount = Object.keys(readiness.checks).length;

  return (
    <div
      className={`rounded-xl border p-4 ${
        readiness.ready
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {readiness.ready ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
          <span className={`font-semibold text-sm ${readiness.ready ? "text-emerald-800" : "text-amber-800"}`}>
            {readiness.ready
              ? "Sistema listo para exportar"
              : "Exportación no disponible todavía"}
          </span>
        </div>
        <Badge
          variant="outline"
          className={readiness.ready ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}
        >
          {passedCount}/{totalCount} checks
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.entries(readiness.checks) as Array<[keyof PublishingReadinessResult["checks"], boolean]>).map(
          ([key, passed]) => (
            <div
              key={key}
              className={`flex items-start gap-2 rounded-lg p-2 ${
                passed ? "bg-emerald-100/60" : "bg-white/60"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              )}
              <span className="text-xs leading-tight text-muted-foreground">
                {CHECK_LABELS[key]}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
