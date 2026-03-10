"use client";

import { CheckCircle2, Circle, AlertCircle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EditorialBookStageChecklist,
  EditorialChecklistItem,
  EditorialStage,
  EditorialStageStatus,
} from "@/types/editorial";
import { EDITORIAL_STAGE_LABELS, EDITORIAL_STATUS_LABELS } from "@/types/editorial";

interface StageChecklistProps {
  checklist: EditorialBookStageChecklist | null;
  stage: EditorialStage;
  onToggleItem: (itemId: string, checked: boolean) => Promise<void>;
  onStart?: () => Promise<void>;
  canManage: boolean;
  isLoading?: boolean;
}

function statusBadgeClass(status: EditorialStageStatus): string {
  const map: Record<EditorialStageStatus, string> = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
    reopened: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return map[status] ?? "";
}

export function StageChecklist({
  checklist,
  stage,
  onToggleItem,
  onStart,
  canManage,
  isLoading = false,
}: StageChecklistProps) {
  if (!checklist) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No hay checklist para esta etapa.
      </div>
    );
  }

  const items: EditorialChecklistItem[] = checklist.items ?? [];
  const requiredItems = items.filter((i) => i.is_required);
  const completedRequired = requiredItems.filter((i) => i.is_checked);
  const progress =
    requiredItems.length > 0
      ? Math.round((completedRequired.length / requiredItems.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {EDITORIAL_STAGE_LABELS[stage]}
          </p>
          <p className="text-xs text-muted-foreground">
            {completedRequired.length}/{requiredItems.length} requeridos completados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs", statusBadgeClass(checklist.status))}
          >
            {EDITORIAL_STATUS_LABELS[checklist.status]}
          </Badge>
          {checklist.status === "pending" && canManage && onStart && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStart}
              disabled={isLoading}
              className="text-xs h-7"
            >
              Iniciar etapa
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Assignee */}
      {checklist.assignee && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Responsable: {checklist.assignee.full_name ?? checklist.assignee.email}</span>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3">
          Sin ítems en este checklist.
        </div>
      ) : (
        <div className="space-y-2">
          {[...items]
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border transition-colors",
                  item.is_checked
                    ? "bg-muted/40 border-muted"
                    : "bg-background border-border"
                )}
              >
                <Checkbox
                  checked={item.is_checked}
                  disabled={!canManage || isLoading || checklist.status === "completed"}
                  onCheckedChange={(checked) =>
                    onToggleItem(item.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm",
                      item.is_checked
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {item.label}
                    {item.is_required && !item.is_checked && (
                      <span className="ml-1 text-red-500 text-xs">*</span>
                    )}
                  </span>
                  {item.checked_at && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.checked_at).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                {item.is_checked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : item.is_required ? (
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
