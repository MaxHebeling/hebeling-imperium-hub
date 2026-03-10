"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  UserPlus,
  UserMinus,
  Shield,
  BookOpen,
  Bell,
  BellOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EditorialWorkflowEvent, EditorialEventType } from "@/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/types/editorial";

interface WorkflowEventFeedProps {
  events: EditorialWorkflowEvent[];
  maxItems?: number;
}

const EVENT_CONFIG: Record<
  EditorialEventType,
  { label: string; icon: React.ElementType; color: string }
> = {
  book_created: {
    label: "Libro creado",
    icon: BookOpen,
    color: "text-blue-500",
  },
  stage_started: {
    label: "Etapa iniciada",
    icon: PlayCircle,
    color: "text-blue-500",
  },
  stage_completed: {
    label: "Etapa completada",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  stage_blocked: {
    label: "Etapa bloqueada",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  stage_reopened: {
    label: "Etapa reabierta",
    icon: RotateCcw,
    color: "text-amber-500",
  },
  checklist_item_checked: {
    label: "Ítem marcado",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
  checklist_item_unchecked: {
    label: "Ítem desmarcado",
    icon: CheckCircle2,
    color: "text-muted-foreground",
  },
  member_assigned: {
    label: "Responsable asignado",
    icon: UserPlus,
    color: "text-blue-500",
  },
  member_unassigned: {
    label: "Responsable removido",
    icon: UserMinus,
    color: "text-muted-foreground",
  },
  alert_created: {
    label: "Alerta creada",
    icon: Bell,
    color: "text-amber-500",
  },
  alert_resolved: {
    label: "Alerta resuelta",
    icon: BellOff,
    color: "text-emerald-500",
  },
  override_applied: {
    label: "Override aplicado",
    icon: Shield,
    color: "text-purple-500",
  },
};

export function WorkflowEventFeed({ events, maxItems }: WorkflowEventFeedProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  if (displayEvents.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        Sin eventos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {displayEvents.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type] ?? {
          label: event.event_type,
          icon: BookOpen,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-muted",
                  index === 0 && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              {index < displayEvents.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-4 flex-1 min-w-0", index === displayEvents.length - 1 && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {config.label}
                    {event.is_override && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs text-purple-600 border-purple-300 bg-purple-50"
                      >
                        override
                      </Badge>
                    )}
                  </p>
                  {event.stage && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Etapa: {EDITORIAL_STAGE_LABELS[event.stage]}
                    </p>
                  )}
                  {event.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      Razón: {event.reason}
                    </p>
                  )}
                  {event.override_reason && (
                    <p className="text-xs text-purple-600 mt-0.5 italic">
                      Override: {event.override_reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.performer?.full_name ?? event.performer?.email ?? "Sistema"}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </time>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
