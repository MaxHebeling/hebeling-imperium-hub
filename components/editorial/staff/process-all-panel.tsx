"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Brain,
  Download,
} from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

interface AnalysisIssue {
  type: string;
  description: string;
  location?: string | null;
  suggestion?: string | null;
}

interface AnalysisResult {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  issues?: AnalysisIssue[];
  recommendations?: string[];
  score?: number;
}

interface StageJob {
  jobType: string;
  status: string;
  result: AnalysisResult | null;
  error: string | null;
}

interface StageSummary {
  stageKey: string;
  status: string;
  aiSummary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  jobs: StageJob[];
}

interface ProcessAllResponse {
  success: boolean;
  currentStage: string;
  projectStatus: string;
  isProcessing: boolean;
  stages: StageSummary[];
}

const AI_STAGE_ORDER = [
  "ingesta",
  "estructura",
  "estilo",
  "ortotipografia",
  "maquetacion",
  "revision_final",
  "export",
  "distribution",
];

function getStageProgress(stages: StageSummary[]): number {
  const completed = stages.filter(
    (s) => s.status === "approved" || s.status === "completed"
  ).length;
  return Math.round((completed / stages.length) * 100);
}

function IssueItem({ issue, index }: { issue: AnalysisIssue; index: number }) {
  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    error: { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-600 dark:text-red-400", label: "Error" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", label: "Advertencia" },
    suggestion: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-600 dark:text-blue-400", label: "Sugerencia" },
  };
  const tc = typeColors[issue.type] ?? typeColors.suggestion;

  return (
    <div className={`rounded-lg border p-3 ${tc.bg}`}>
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={`shrink-0 text-xs ${tc.text}`}>
          #{index + 1} {tc.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{issue.description}</p>
          {issue.location && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold">Ubicacion:</span> {issue.location}
            </p>
          )}
          {issue.suggestion && (
            <div className="mt-2 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Correccion sugerida:</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-0.5">{issue.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StageResultCard({ stage }: { stage: StageSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const label = EDITORIAL_STAGE_LABELS[stage.stageKey as keyof typeof EDITORIAL_STAGE_LABELS] ?? stage.stageKey;
  const hasResults = stage.jobs.some((j) => j.status === "completed" && j.result);
  const hasFailed = stage.jobs.some((j) => j.status === "failed");
  const isRunning = stage.jobs.some((j) => j.status === "queued" || j.status === "processing");
  const isPending = stage.status === "pending";

  // Collect all issues across jobs for this stage
  const allIssues: AnalysisIssue[] = [];
  const allStrengths: string[] = [];
  const allImprovements: string[] = [];
  const allRecommendations: string[] = [];
  let bestScore: number | null = null;
  let summary = "";

  for (const job of stage.jobs) {
    if (job.result) {
      if (job.result.summary && !summary) summary = job.result.summary;
      if (job.result.score && (bestScore === null || job.result.score < bestScore)) {
        bestScore = job.result.score;
      }
      if (job.result.issues) allIssues.push(...job.result.issues);
      if (job.result.strengths) allStrengths.push(...job.result.strengths);
      if (job.result.improvements) allImprovements.push(...job.result.improvements);
      if (job.result.recommendations) allRecommendations.push(...job.result.recommendations);
    }
  }

  const errorCount = allIssues.filter((i) => i.type === "error").length;
  const warningCount = allIssues.filter((i) => i.type === "warning").length;
  const suggestionCount = allIssues.filter((i) => i.type === "suggestion").length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            ) : hasResults ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : hasFailed ? (
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-sm">{label}</span>
            {bestScore !== null && (
              <Badge variant={bestScore >= 7 ? "default" : bestScore >= 5 ? "secondary" : "destructive"} className="text-xs">
                {bestScore}/10
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isRunning && <Badge variant="default" className="text-xs">Procesando...</Badge>}
            {isPending && !isRunning && <Badge variant="secondary" className="text-xs">Pendiente</Badge>}
            {hasResults && (
              <>
                {errorCount > 0 && <Badge variant="destructive" className="text-xs">{errorCount} errores</Badge>}
                {warningCount > 0 && <Badge variant="default" className="text-xs">{warningCount} advertencias</Badge>}
                {suggestionCount > 0 && <Badge variant="secondary" className="text-xs">{suggestionCount} sugerencias</Badge>}
              </>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-4 mt-2 space-y-3 pb-2">
          {/* Summary */}
          {summary && (
            <div className="rounded-lg bg-muted/50 p-3">
              <h5 className="text-xs font-semibold mb-1 text-muted-foreground uppercase">Resumen</h5>
              <p className="text-sm">{summary}</p>
            </div>
          )}

          {/* Strengths */}
          {allStrengths.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Fortalezas ({allStrengths.length})
              </h5>
              <ul className="space-y-1">
                {allStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-emerald-500 shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {allImprovements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Areas de Mejora ({allImprovements.length})
              </h5>
              <ul className="space-y-1">
                {allImprovements.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-amber-500 shrink-0">-</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Issues 1x1 */}
          {allIssues.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Hallazgos Detallados ({allIssues.length}) - Revision 1x1
              </h5>
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {allIssues.map((issue, i) => (
                    <IssueItem key={i} issue={issue} index={i} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Recommendations */}
          {allRecommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Lightbulb className="h-3.5 w-3.5" />
                Recomendaciones ({allRecommendations.length})
              </h5>
              <ul className="space-y-1">
                {allRecommendations.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-blue-500 shrink-0">{i + 1}.</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed jobs */}
          {hasFailed && (
            <div className="rounded-lg bg-destructive/10 p-3">
              {stage.jobs
                .filter((j) => j.status === "failed")
                .map((j, i) => (
                  <p key={i} className="text-sm text-destructive">
                    Error en {j.jobType}: {j.error ?? "Error desconocido"}
                  </p>
                ))}
            </div>
          )}

          {/* Running state */}
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando analisis con IA...
            </div>
          )}

          {/* No results yet */}
          {!hasResults && !isRunning && !hasFailed && !isPending && (
            <p className="text-sm text-muted-foreground">No hay resultados de IA para esta etapa.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ProcessAllPanelProps {
  projectId: string;
  currentStage: string;
}

export function ProcessAllPanel({ projectId, currentStage }: ProcessAllPanelProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<StageSummary[]>([]);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`);
      const json: ProcessAllResponse = await res.json();
      if (json.success) {
        setStages(json.stages);
        setIsProcessing(json.isProcessing);
        setProgress(getStageProgress(json.stages));

        if (!json.isProcessing && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          router.refresh();
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, [projectId, router]);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  async function handleProcessAll() {
    setError(null);
    setIsStarting(true);
    setHasStarted(true);

    try {
      const res = await fetch(`/api/editorial/projects/${projectId}/process-all`, {
        method: "POST",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "No se pudo iniciar el procesamiento.");
        setIsStarting(false);
        return;
      }

      setIsProcessing(true);
      setIsStarting(false);

      // Start polling for status
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchStatus();
        }, 4000);
      }

      // Immediate first fetch
      await fetchStatus();
    } catch {
      setError("Error de red al iniciar el procesamiento.");
      setIsStarting(false);
    }
  }

  // Count totals across all stages
  const totalIssues = stages.reduce((acc, s) => {
    return acc + s.jobs.reduce((jAcc, j) => jAcc + (j.result?.issues?.length ?? 0), 0);
  }, 0);

  const totalErrors = stages.reduce((acc, s) => {
    return acc + s.jobs.reduce((jAcc, j) => jAcc + (j.result?.issues?.filter((i) => i.type === "error").length ?? 0), 0);
  }, 0);

  const totalWarnings = stages.reduce((acc, s) => {
    return acc + s.jobs.reduce((jAcc, j) => jAcc + (j.result?.issues?.filter((i) => i.type === "warning").length ?? 0), 0);
  }, 0);

  const completedStages = stages.filter(
    (s) => s.status === "approved" || s.status === "completed"
  ).length;

  const hasAnyResults = stages.some((s) => s.jobs.some((j) => j.result));

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Procesamiento Completo con IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              La IA analiza tu manuscrito en todas las etapas automaticamente.
              Revisa los resultados antes de enviar a produccion.
            </p>
          </div>
          {!isProcessing && !hasAnyResults && (
            <Button
              onClick={handleProcessAll}
              disabled={isStarting}
              className="shrink-0"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isStarting ? "Iniciando..." : "Procesar Todo con IA"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Progress Bar */}
        {(isProcessing || hasAnyResults) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isProcessing ? "Procesando..." : "Procesamiento completado"}
              </span>
              <span className="font-medium">
                {completedStages}/{stages.length} etapas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary Stats */}
        {hasAnyResults && !isProcessing && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{totalIssues}</p>
              <p className="text-xs text-muted-foreground">Hallazgos Totales</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{totalErrors}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{totalWarnings}</p>
              <p className="text-xs text-muted-foreground">Advertencias</p>
            </div>
          </div>
        )}

        {/* Stage-by-stage results */}
        {(isProcessing || hasAnyResults) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resultados por Etapa
              </h4>
              <div className="space-y-2">
                {stages.map((stage) => (
                  <StageResultCard key={stage.stageKey} stage={stage} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action buttons: Re-process + Download Report */}
        {hasAnyResults && !isProcessing && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.open(`/api/editorial/projects/${projectId}/correction-report`, "_blank");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Reporte (.docx)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleProcessAll}
              disabled={isStarting}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Re-procesar con IA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
