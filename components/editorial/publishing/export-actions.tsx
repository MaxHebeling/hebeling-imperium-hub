"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileDown, Loader2, AlertCircle } from "lucide-react";
import { EXPORT_FORMATS } from "@/types/editorial";
import type { ExportFormat, EditorialPublicationVersion } from "@/types/editorial";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf_print:   "PDF Print-ready",
  epub:        "EPUB",
  kindle_mobi: "Kindle MOBI",
  kindle_kpf:  "Kindle KPF",
  html:        "HTML",
};

interface ExportActionsProps {
  projectId: string;
  publicationVersion: EditorialPublicationVersion;
  readyToExport: boolean;
  blockers: string[];
}

export function ExportActions({ projectId, publicationVersion, readyToExport, blockers }: ExportActionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf_print");
  const [isPending, startTransition] = useTransition();
  const [lastError, setLastError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExport = () => {
    setLastError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await fetch("/api/editorial/publishing/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          publication_version_id: publicationVersion.id,
          format: selectedFormat,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setLastError(json.error ?? "Error al crear la exportación");
      } else {
        setSuccessMsg(`Exportación ${FORMAT_LABELS[selectedFormat]} encolada correctamente. ID: ${json.data.id}`);
        // Refresh to show new export in list
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Version badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Versión seleccionada:</span>
        <Badge variant="outline" className="font-mono">{publicationVersion.version_tag}</Badge>
        <Badge
          variant="outline"
          className={
            publicationVersion.status === "ready"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-700"
          }
        >
          {publicationVersion.status === "ready" ? "Lista" : publicationVersion.status}
        </Badge>
      </div>

      {/* Blockers */}
      {!readyToExport && blockers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
            <AlertCircle className="h-4 w-4" />
            Requisitos pendientes
          </div>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Format selector + trigger */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={selectedFormat}
          onValueChange={(v) => setSelectedFormat(v as ExportFormat)}
          disabled={!readyToExport || isPending}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Seleccionar formato" />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_FORMATS.map((fmt) => (
              <SelectItem key={fmt} value={fmt}>
                {FORMAT_LABELS[fmt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleExport}
          disabled={!readyToExport || isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isPending ? "Encolando..." : "Generar exportación"}
        </Button>
      </div>

      {/* Feedback */}
      {lastError && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {lastError}
        </p>
      )}
      {successMsg && (
        <p className="text-sm text-emerald-600">{successMsg}</p>
      )}
    </div>
  );
}
