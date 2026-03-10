"use client";

import { Badge } from "@/components/ui/badge";
import { FileDown, User, Calendar, ArrowRight } from "lucide-react";
import type { EditorialExportRun, ExportFormat } from "@/types/editorial";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf_print:   "PDF Print-ready",
  epub:        "EPUB",
  kindle_mobi: "Kindle MOBI",
  kindle_kpf:  "Kindle KPF",
  html:        "HTML",
};

const STATUS_CLASSES: Record<string, string> = {
  queued:    "bg-slate-100 text-slate-600",
  running:   "bg-blue-100 text-blue-700",
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

interface ExportHistoryTableProps {
  exports: EditorialExportRun[];
}

export function ExportHistoryTable({ exports }: ExportHistoryTableProps) {
  if (exports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Sin exportaciones registradas</p>
        <p className="text-sm mt-1">Las exportaciones generadas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
            <th className="text-left py-3 px-2">Formato</th>
            <th className="text-left py-3 px-2">Estado</th>
            <th className="text-left py-3 px-2">Motor</th>
            <th className="text-left py-3 px-2">Tamaño</th>
            <th className="text-left py-3 px-2">Duración</th>
            <th className="text-left py-3 px-2">Creado</th>
            <th className="text-left py-3 px-2">Archivo</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {exports.map((run) => {
            const sizeKB = run.output_size_bytes ? Math.round(run.output_size_bytes / 1024) : null;
            const durSec = run.duration_ms ? (run.duration_ms / 1000).toFixed(1) : null;
            const createdAt = new Date(run.created_at).toLocaleDateString("es-ES", {
              day: "2-digit", month: "short", year: "numeric",
            });

            return (
              <tr key={run.id} className={cn("hover:bg-muted/20", run.status === "failed" && "bg-red-50/40")}>
                <td className="py-3 px-2">
                  <span className="font-medium">{FORMAT_LABELS[run.format] ?? run.format}</span>
                </td>
                <td className="py-3 px-2">
                  <Badge className={cn("text-xs", STATUS_CLASSES[run.status] ?? "bg-muted")} variant="secondary">
                    {STATUS_LABELS[run.status] ?? run.status}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  {run.engine ?? "—"}
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  {sizeKB !== null ? `${sizeKB} KB` : "—"}
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  {durSec !== null ? `${durSec}s` : "—"}
                </td>
                <td className="py-3 px-2 text-muted-foreground">{createdAt}</td>
                <td className="py-3 px-2">
                  {run.output_file_url ? (
                    <a
                      href={run.output_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      Descargar <ArrowRight className="h-3 w-3" />
                    </a>
                  ) : run.status === "failed" && run.error_message ? (
                    <span className="text-xs text-red-600 truncate max-w-xs block" title={run.error_message}>
                      {run.error_message}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
