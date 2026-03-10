"use client";

import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EditorialBookAlert,
  EditorialAlertSeverity,
} from "@/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/types/editorial";

interface BlockedBookAlertProps {
  alerts: EditorialBookAlert[];
  onResolve?: (alertId: string) => Promise<void>;
  canResolve?: boolean;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  EditorialAlertSeverity,
  { icon: React.ElementType; containerClass: string; iconClass: string; label: string }
> = {
  critical: {
    icon: AlertCircle,
    containerClass: "bg-red-50 border-red-200 text-red-900",
    iconClass: "text-red-500",
    label: "Crítico",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-amber-50 border-amber-200 text-amber-900",
    iconClass: "text-amber-500",
    label: "Advertencia",
  },
  info: {
    icon: Info,
    containerClass: "bg-blue-50 border-blue-200 text-blue-900",
    iconClass: "text-blue-500",
    label: "Info",
  },
};

export function BlockedBookAlert({
  alerts,
  onResolve,
  canResolve = false,
  className,
}: BlockedBookAlertProps) {
  if (alerts.length === 0) {
    return null;
  }

  // Sort: critical first, then warning, then info
  const sorted = [...alerts].sort((a, b) => {
    const order: Record<EditorialAlertSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
              config.containerClass
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.iconClass)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{alert.message}</p>
              {alert.stage && (
                <p className="text-xs opacity-75 mt-0.5">
                  Etapa: {EDITORIAL_STAGE_LABELS[alert.stage]}
                </p>
              )}
            </div>
            {canResolve && onResolve && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 shrink-0"
                onClick={() => onResolve(alert.id)}
                title="Marcar como resuelto"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
