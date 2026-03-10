"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import type { EditorialExportRun, ExportFormat } from "@/types/editorial";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf_print:   "PDF Print-ready",
  epub:        "EPUB",
  kindle_mobi: "Kindle MOBI",
  kindle_kpf:  "Kindle KPF",
  html:        "HTML",
};

const FORMAT_COLORS: Record<ExportFormat, string> = {
  pdf_print:   "bg-red-100 text-red-700 border-red-200",
  epub:        "bg-blue-100 text-blue-700 border-blue-200",
  kindle_mobi: "bg-amber-100 text-amber-700 border-amber-200",
  kindle_kpf:  "bg-amber-100 text-amber-700 border-amber-200",
  html:        "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_BADGES: Record<string, string> = {
  queued:    "bg-slate-100 text-slate-600",
  running:   "bg-blue-100 text-blue-700 animate-pulse",
  completed: "bg-emerald-100 text-emerald-700",
  failed:    "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  queued:    "En cola",
  running:   "Procesando",
  completed: "Completado",
  failed:    "Error",
  cancelled: "Cancelado",
};

interface ExportListProps {
  exports: EditorialExportRun[];
  compact?: boolean;
}

export function ExportList({ exports, compact }: ExportListProps) {
  if (exports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileDown className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Sin exportaciones generadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exports.map((run) => (
        <ExportRow key={run.id} run={run} compact={compact} />
      ))}
    </div>
  );
}

function ExportRow({ run, compact }: { run: EditorialExportRun; compact?: boolean }) {
  const formatLabel = FORMAT_LABELS[run.format] ?? run.format;
  const formatColor = FORMAT_COLORS[run.format] ?? "bg-muted text-muted-foreground";
  const statusClass = STATUS_BADGES[run.status] ?? STATUS_BADGES.queued;
  const statusLabel = STATUS_LABELS[run.status] ?? run.status;

  const createdAt = new Date(run.created_at).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const sizeKB = run.output_size_bytes ? Math.round(run.output_size_bytes / 1024) : null;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 gap-4",
        run.status === "failed" && "border-red-200 bg-red-50/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs shrink-0", formatColor)}>
              {formatLabel}
            </Badge>
            <Badge className={cn("text-xs shrink-0", statusClass)} variant="secondary">
              {statusLabel}
            </Badge>
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">{createdAt}</p>
          )}
          {run.status === "failed" && run.error_message && (
            <p className="text-xs text-red-600 mt-1 truncate" title={run.error_message}>
              {run.error_message}
            </p>
          )}
          {run.status === "completed" && sizeKB !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">{sizeKB} KB</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {run.status === "completed" && run.output_file_url && (
          <Button size="sm" variant="ghost" asChild>
            <a href={run.output_file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Descargar
            </a>
          </Button>
        )}
        {run.status === "failed" && (
          <Button size="sm" variant="ghost" className="text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
