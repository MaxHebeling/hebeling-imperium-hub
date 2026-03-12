"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Package
} from "lucide-react";
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_QUALITY_LABELS,
  type ExportFormat,
  type ExportQuality,
  type EditorialExportJob,
} from "@/lib/editorial/export/types";
import type { StageWithApprover } from "@/lib/editorial/types/editorial";

interface StageExportPanelProps {
  projectId: string;
  stage: StageWithApprover;
  exports: EditorialExportJob[];
  onExportCreated?: () => void;
}

const AVAILABLE_FORMATS: ExportFormat[] = ["pdf", "epub", "mobi", "docx"];
const AVAILABLE_QUALITIES: ExportQuality[] = ["digital", "print", "review"];

export function StageExportPanel({ 
  projectId, 
  stage, 
  exports,
  onExportCreated 
}: StageExportPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(["pdf", "epub"]);
  const [selectedQuality, setSelectedQuality] = useState<ExportQuality>("digital");
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  function toggleFormat(format: ExportFormat) {
    setSelectedFormats(prev => 
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  }

  async function handleCreateExports() {
    if (selectedFormats.length === 0) {
      setError("Selecciona al menos un formato");
      return;
    }

    setError(null);
    setCreatedCount(0);
    
    startTransition(async () => {
      try {
        let created = 0;
        
        for (const format of selectedFormats) {
          const res = await fetch(
            `/api/editorial/projects/${projectId}/exports`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                format,
                quality: selectedQuality,
                config: {
                  includeMetadata: true,
                  includeCover: true,
                  includeTableOfContents: true,
                },
              }),
            }
          );
          const json = await res.json();

          if (json.export) {
            created++;
          }
        }

        setCreatedCount(created);
        router.refresh();
        onExportCreated?.();
      } catch {
        setError("Error al crear los exports");
      }
    });
  }

  async function handleApproveStage() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/export/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Exports generados correctamente" }),
          }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "No se pudo aprobar la etapa.");
          return;
        }

        router.refresh();
      } catch {
        setError("Error de red al aprobar la etapa.");
      }
    });
  }

  const isApproved = stage.status === "approved" || stage.status === "completed";
  const hasExports = exports.length > 0;
  const completedExports = exports.filter(e => e.status === "completed");

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Exportacion</CardTitle>
          </div>
          <Badge 
            variant={isApproved ? "default" : "secondary"}
            className={isApproved ? "bg-emerald-600" : ""}
          >
            {isApproved ? "Completada" : "En proceso"}
          </Badge>
        </div>
        <CardDescription>
          Genera los archivos finales en diferentes formatos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success message */}
        {createdCount > 0 && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{createdCount} export(s) creados correctamente</span>
            </div>
          </div>
        )}

        {/* Format selection */}
        {!isApproved && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Formatos a generar</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FORMATS.map((format) => (
                  <div
                    key={format}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFormats.includes(format)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-border hover:border-blue-300"
                    }`}
                    onClick={() => toggleFormat(format)}
                  >
                    <Checkbox
                      checked={selectedFormats.includes(format)}
                      onCheckedChange={() => toggleFormat(format)}
                    />
                    <div>
                      <p className="text-sm font-medium">{EXPORT_FORMAT_LABELS[format]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Calidad</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_QUALITIES.map((quality) => (
                  <Badge
                    key={quality}
                    variant={selectedQuality === quality ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedQuality(quality)}
                  >
                    {EXPORT_QUALITY_LABELS[quality]}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Generated exports list */}
        {hasExports && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Exports generados ({exports.length})
            </Label>
            <div className="space-y-2">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {EXPORT_FORMAT_LABELS[exp.export_type]} v{exp.version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {EXPORT_QUALITY_LABELS[exp.quality]} - {
                          exp.file_size_bytes 
                            ? `${(exp.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                            : "Generando..."
                        }
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={exp.status === "completed" ? "default" : "secondary"}
                    className={exp.status === "completed" ? "bg-emerald-600" : ""}
                  >
                    {exp.status === "completed" ? "Listo" : 
                     exp.status === "processing" ? "Procesando" : 
                     exp.status === "failed" ? "Error" : "En cola"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved state */}
        {isApproved && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Exports listos para distribucion.</span>
            </div>
          </div>
        )}
      </CardContent>

      {!isApproved && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          {!hasExports ? (
            <Button
              onClick={handleCreateExports}
              disabled={isPending || selectedFormats.length === 0}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generar Exports
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCreateExports}
                disabled={isPending || selectedFormats.length === 0}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Generar mas
              </Button>
              <Button
                onClick={handleApproveStage}
                disabled={isPending || completedExports.length === 0}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aprobar y Continuar
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
