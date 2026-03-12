"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Play,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/editorial/ai/processor";

interface AiJob {
  id: string;
  projectId: string;
  stageKey: string;
  jobType: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorLog: string | null;
  result: AnalysisResult | null;
}

interface AiResultsPanelProps {
  projectId: string;
  stageKey: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  manuscript_analysis: "Analisis de Manuscrito",
  structure_analysis: "Analisis de Estructura",
  style_suggestions: "Sugerencias de Estilo",
  orthotypography_review: "Revision Ortotipografica",
  issue_detection: "Deteccion de Problemas",
  quality_scoring: "Puntuacion de Calidad",
  redline_diff: "Comparacion de Cambios",
  layout_analysis: "Analisis de Maquetacion",
  typography_check: "Verificacion Tipografica",
  page_flow_review: "Revision de Flujo",
  export_validation: "Validacion de Export",
  metadata_generation: "Generacion de Metadatos",
};

const STATUS_CONFIG = {
  queued: { label: "En cola", variant: "secondary" as const, icon: Loader2 },
  processing: { label: "Procesando", variant: "default" as const, icon: Loader2 },
  completed: { label: "Completado", variant: "default" as const, icon: CheckCircle2 },
  failed: { label: "Error", variant: "destructive" as const, icon: XCircle },
  cancelled: { label: "Cancelado", variant: "outline" as const, icon: XCircle },
};

function IssueItem({ issue }: { issue: AnalysisResult["issues"][0] }) {
  const iconMap = {
    error: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
    suggestion: <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" />,
  };

  return (
    <div className="flex gap-2 p-2 rounded-lg bg-muted/30 text-sm">
      {iconMap[issue.type]}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{issue.description}</p>
        {issue.location && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Ubicacion: {issue.location}
          </p>
        )}
        {issue.suggestion && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Sugerencia: {issue.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

function JobResultCard({ job, onRetry }: { job: AiJob; onRetry: () => void }) {
  const [isOpen, setIsOpen] = useState(job.status === "completed");
  const statusConfig = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
  const StatusIcon = statusConfig.icon;
  const isRunning = job.status === "queued" || job.status === "processing";

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm truncate">
                  {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                </span>
              </div>
              <Badge variant={statusConfig.variant} className="shrink-0">
                {isRunning && <StatusIcon className="h-3 w-3 mr-1 animate-spin" />}
                {statusConfig.label}
              </Badge>
            </div>
            {job.result?.score && (
              <div className="flex items-center gap-1 ml-8 mt-1">
                <span className="text-xs text-muted-foreground">Puntuacion:</span>
                <Badge 
                  variant={job.result.score >= 7 ? "default" : job.result.score >= 5 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {job.result.score}/10
                </Badge>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {/* Error state */}
            {job.status === "failed" && (
              <div className="rounded-lg bg-destructive/10 p-3 mb-4">
                <p className="text-sm text-destructive font-medium">Error al procesar:</p>
                <p className="text-sm text-muted-foreground mt-1">{job.errorLog ?? "Error desconocido"}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
              </div>
            )}

            {/* Processing state */}
            {isRunning && (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Procesando analisis con IA...</p>
                <p className="text-xs mt-1">Esto puede tomar unos minutos.</p>
              </div>
            )}

            {/* Results */}
            {job.status === "completed" && job.result && (
              <div className="space-y-4">
                {/* Summary */}
                {job.result.summary && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Resumen</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {job.result.summary}
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {job.result.strengths?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1">
                      {job.result.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-emerald-500 shrink-0">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {job.result.improvements?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Areas de Mejora
                    </h4>
                    <ul className="space-y-1">
                      {job.result.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-amber-500 shrink-0">-</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {job.result.issues?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Problemas Detectados ({job.result.issues.length})
                    </h4>
                    <ScrollArea className="max-h-60">
                      <div className="space-y-2">
                        {job.result.issues.slice(0, 20).map((issue, i) => (
                          <IssueItem key={i} issue={issue} />
                        ))}
                        {job.result.issues.length > 20 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            ... y {job.result.issues.length - 20} problemas mas
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Recommendations */}
                {job.result.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Recomendaciones
                    </h4>
                    <ul className="space-y-1">
                      {job.result.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-blue-500 shrink-0">{i + 1}.</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function AiResultsPanel({ projectId, stageKey }: AiResultsPanelProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/ai-jobs?stageKey=${stageKey}`
      );
      const json = await res.json();
      if (json.success) {
        setJobs(json.jobs);
        
        // Check if we need to start/stop polling
        const hasRunning = json.jobs.some((j: AiJob) => j.status === "queued" || j.status === "processing");
        
        if (hasRunning && !pollingRef.current) {
          // Start polling
          pollingRef.current = setInterval(() => {
            fetchJobs();
          }, 5000);
        } else if (!hasRunning && pollingRef.current) {
          // Stop polling
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error cargando trabajos de IA");
    } finally {
      setLoading(false);
    }
  }, [projectId, stageKey]);

  useEffect(() => {
    fetchJobs();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchJobs]);

  async function handleRetry(jobId: string) {
    startTransition(async () => {
      try {
        await fetch(`/api/editorial/ai/jobs/${jobId}`, { method: "POST" });
        await fetchJobs();
        router.refresh();
      } catch {
        setError("Error al reintentar el trabajo");
      }
    });
  }

  async function handleProcessAll() {
    startTransition(async () => {
      try {
        await fetch("/api/editorial/ai/process", { method: "POST" });
        await fetchJobs();
        router.refresh();
      } catch {
        setError("Error al procesar trabajos");
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasQueuedJobs = jobs.some(j => j.status === "queued");
  const hasRunningJobs = jobs.some(j => j.status === "processing");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analisis de IA
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Resultados del analisis automatizado
            </CardDescription>
          </div>
          {hasQueuedJobs && (
            <Button 
              size="sm" 
              onClick={handleProcessAll}
              disabled={isPending || hasRunningJobs}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Procesar Pendientes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay analisis de IA para esta etapa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobResultCard 
                key={job.id} 
                job={job} 
                onRetry={() => handleRetry(job.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
