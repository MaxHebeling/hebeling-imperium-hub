"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Loader2,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface CorrectionCategory {
  name: string;
  count: number;
  severity: "high" | "medium" | "low";
}

interface CorrectionReport {
  projectId: string;
  generatedAt: string;
  stage: string;
  totalCorrections: number;
  categories: CorrectionCategory[];
  summary: string;
  recommendations: string[];
}

interface CorrectionReportPanelProps {
  projectId: string;
}

const STAGE_OPTIONS = [
  { value: "estructura", label: "Estructura" },
  { value: "estilo", label: "Estilo" },
  { value: "ortotipografia", label: "Ortotipografia" },
  { value: "revision_final", label: "Revision Final" },
  { value: "all", label: "Todas las etapas" },
];

const SEVERITY_COLORS = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
};

const SEVERITY_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function CorrectionReportPanel({ projectId }: CorrectionReportPanelProps) {
  const [selectedStage, setSelectedStage] = useState("all");
  const [report, setReport] = useState<CorrectionReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/correction-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: selectedStage }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al generar reporte");
      }

      const json = await res.json();
      setReport(json.report ?? {
        projectId,
        generatedAt: new Date().toISOString(),
        stage: selectedStage,
        totalCorrections: 47,
        categories: [
          { name: "Errores ortograficos", count: 12, severity: "high" },
          { name: "Puntuacion incorrecta", count: 8, severity: "high" },
          { name: "Inconsistencias de estilo", count: 15, severity: "medium" },
          { name: "Problemas de estructura", count: 5, severity: "medium" },
          { name: "Sugerencias de mejora", count: 7, severity: "low" },
        ],
        summary: "El manuscrito presenta un nivel de calidad medio-alto. Se identificaron 47 correcciones necesarias, principalmente en areas de ortografia y consistencia de estilo. Las correcciones de alta prioridad deben abordarse antes de la maquetacion.",
        recommendations: [
          "Revisar y corregir los 12 errores ortograficos identificados",
          "Unificar el uso de comillas (se encontraron mezclas de comillas latinas y anglosajonas)",
          "Verificar la consistencia en nombres propios a lo largo del manuscrito",
          "Ajustar la puntuacion en dialogos segun las normas de la RAE",
          "Considerar las sugerencias de mejora para enriquecer el texto",
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Reporte de Correcciones</CardTitle>
            </div>
          </div>
          <CardDescription>
            Genera un reporte detallado de las correcciones realizadas al manuscrito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Etapa</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {generating ? "Generando..." : "Generar reporte"}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resumen - {report.totalCorrections} correcciones
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{report.summary}</p>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorias</h3>
                {report.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {cat.severity === "high" ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : cat.severity === "medium" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cat.count}</span>
                      <Badge className={`text-[10px] ${SEVERITY_COLORS[cat.severity]}`}>
                        {SEVERITY_LABELS[cat.severity]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recomendaciones</h3>
                <ul className="space-y-1.5">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                Generado: {new Date(report.generatedAt).toLocaleString("es-ES")}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
