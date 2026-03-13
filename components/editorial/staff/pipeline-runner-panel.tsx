"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Rocket } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

interface StageResult {
  stage: string;
  status: "completed" | "skipped" | "failed";
  aiAnalysis?: boolean;
  aiTask?: string;
  error?: string;
}

interface PipelineRunnerPanelProps {
  projectId: string;
  currentStage: string;
  projectStatus: string;
}

export function PipelineRunnerPanel({ projectId, currentStage, projectStatus }: PipelineRunnerPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StageResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isCompleted = projectStatus === "completed";

  async function handleRunPipeline() {
    if (!confirm("¿Ejecutar el pipeline editorial completo? Esto procesará todas las etapas automáticamente.")) {
      return;
    }

    setRunning(true);
    setResults(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/pipeline/run`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error ?? `Error HTTP ${res.status}`;
        toast({ title: "Error al ejecutar pipeline", description: errorMsg, variant: "destructive" });
        setMessage(errorMsg);
        return;
      }

      setResults(json.stagesProcessed ?? []);
      setMessage(json.message ?? "Pipeline completado.");

      if (json.completed) {
        toast({ title: "Pipeline completado", description: "El libro está listo para publicar." });
      } else {
        toast({ title: "Pipeline parcial", description: json.message, variant: "destructive" });
      }

      router.refresh();
    } catch {
      toast({ title: "Error de red", description: "No se pudo ejecutar el pipeline.", variant: "destructive" });
      setMessage("Error de red al ejecutar el pipeline.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Pipeline Editorial Automatizado
            </CardTitle>
            <CardDescription>
              Ejecuta todo el proceso editorial automáticamente: desde ingesta hasta distribución.
            </CardDescription>
          </div>
          <Button
            onClick={handleRunPipeline}
            disabled={running || isCompleted}
            className="gap-2"
            size="lg"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Completado
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Ejecutar Pipeline
              </>
            )}
          </Button>
        </div>
        {!isCompleted && !running && (
          <p className="text-xs text-muted-foreground mt-2">
            Etapa actual: <Badge variant="outline" className="ml-1">{EDITORIAL_STAGE_LABELS[currentStage as keyof typeof EDITORIAL_STAGE_LABELS] ?? currentStage}</Badge>
          </p>
        )}
      </CardHeader>

      {running && (
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Ejecutando pipeline editorial...</p>
              <p className="text-xs text-muted-foreground">
                Procesando cada etapa con AI (OpenAI + Claude): análisis, aprobación y avance automático. Esto puede tomar varios minutos.
              </p>
            </div>
          </div>
        </CardContent>
      )}

      {results && results.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">Resultado del pipeline:</p>
            {results.map((result) => (
              <div
                key={result.stage}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  {result.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : result.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">
                    {EDITORIAL_STAGE_LABELS[result.stage as keyof typeof EDITORIAL_STAGE_LABELS] ?? result.stage}
                  </span>
                  {result.aiAnalysis && (
                    <Badge variant="secondary" className="text-[10px]">{result.aiTask ?? "AI"}</Badge>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    result.status === "completed"
                      ? "text-emerald-500 border-emerald-500/30"
                      : result.status === "failed"
                      ? "text-red-500 border-red-500/30"
                      : "text-amber-500 border-amber-500/30"
                  }
                >
                  {result.status === "completed" ? "Completada" : result.status === "failed" ? "Falló" : "Omitida"}
                </Badge>
              </div>
            ))}
            {message && (
              <p className="text-sm text-muted-foreground mt-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                {message}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
