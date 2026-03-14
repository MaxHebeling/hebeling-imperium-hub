"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeftRight,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";

interface ManuscriptVersion {
  id: string;
  version: number;
  storagePath: string;
  createdAt: string;
  sizeBytes: number;
}

interface ComparisonResult {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  sections: ComparisonSection[];
}

interface ComparisonSection {
  id: string;
  title: string;
  type: "addition" | "deletion" | "modification" | "unchanged";
  originalText?: string;
  modifiedText?: string;
  lineNumber: number;
}

interface ManuscriptComparisonToolProps {
  projectId: string;
  versions: ManuscriptVersion[];
}

export function ManuscriptComparisonTool({ projectId, versions }: ManuscriptComparisonToolProps) {
  const [leftVersion, setLeftVersion] = useState<string>(versions.length > 1 ? versions[1].id : "");
  const [rightVersion, setRightVersion] = useState<string>(versions.length > 0 ? versions[0].id : "");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runComparison() {
    if (!leftVersion || !rightVersion) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/compare-manuscripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftVersionId: leftVersion, rightVersionId: rightVersion }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al comparar manuscritos");
      }

      const result = await res.json();
      setComparison(result.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (versions.length < 2) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Se necesitan al menos 2 versiones del manuscrito para comparar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Comparacion de Manuscritos</CardTitle>
          </div>
          <CardDescription>
            Compara dos versiones del manuscrito para ver los cambios realizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Version original</label>
              <Select value={leftVersion} onValueChange={setLeftVersion}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version} - {new Date(v.createdAt).toLocaleDateString("es-ES")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-center pb-1">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Version corregida</label>
              <Select value={rightVersion} onValueChange={setRightVersion}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version} - {new Date(v.createdAt).toLocaleDateString("es-ES")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={runComparison} disabled={loading || !leftVersion || !rightVersion || leftVersion === rightVersion} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
              {loading ? "Comparando..." : "Comparar versiones"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {comparison && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resultados de comparacion</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 gap-1">
                  <Plus className="h-3 w-3" />
                  {comparison.additions}
                </Badge>
                <Badge className="bg-destructive/10 text-destructive gap-1">
                  <Minus className="h-3 w-3" />
                  {comparison.deletions}
                </Badge>
                <Badge variant="secondary">{comparison.totalChanges} cambios</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {comparison.sections.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No se encontraron diferencias entre las versiones.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {comparison.sections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border p-3 text-sm ${
                      section.type === "addition"
                        ? "border-emerald-200 bg-emerald-500/5"
                        : section.type === "deletion"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-amber-200 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Linea {section.lineNumber} - {section.title}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          section.type === "addition"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : section.type === "deletion"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {section.type === "addition" ? "Agregado" : section.type === "deletion" ? "Eliminado" : "Modificado"}
                      </Badge>
                    </div>
                    {section.originalText && (
                      <p className="text-xs text-destructive/80 line-through">{section.originalText}</p>
                    )}
                    {section.modifiedText && (
                      <p className="text-xs text-emerald-700">{section.modifiedText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
