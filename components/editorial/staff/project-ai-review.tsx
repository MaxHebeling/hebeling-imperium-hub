"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import type { EditorialManuscriptAnalysis } from "@/lib/editorial/ai/openai";

type AiStatus = "idle" | "processing" | "completed" | "failed";

interface ProcessResponse {
  success: boolean;
  jobId?: string;
  analysis?: EditorialManuscriptAnalysis;
  error?: string;
}

interface ManuscriptJobSummary {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  fileId?: string | null;
  fileVersion?: number | null;
  readiness_score?: number | null;
}

interface StateResponse {
  success: boolean;
  latestJob: ManuscriptJobSummary | null;
  latestAnalysis: EditorialManuscriptAnalysis | null;
  recentJobs: ManuscriptJobSummary[];
  latestManuscriptVersion?: number | null;
  analyzedFileVersion?: number | null;
  isOutdated?: boolean;
  error?: string;
}

export function StaffProjectAiReview({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [analysis, setAnalysis] = useState<EditorialManuscriptAnalysis | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [recentJobs, setRecentJobs] = useState<ManuscriptJobSummary[]>([]);
  const [latestManuscriptVersion, setLatestManuscriptVersion] = useState<number | null>(null);
  const [analyzedFileVersion, setAnalyzedFileVersion] = useState<number | null>(null);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);

  function computeStatusFromJob(job: ManuscriptJobSummary | null): AiStatus {
    if (!job) return "idle";
    if (job.status === "queued" || job.status === "processing") return "processing";
    if (job.status === "completed") return "completed";
    if (job.status === "failed") return "failed";
    return "idle";
  }

  function getFriendlyError(raw: string | null): string | null {
    if (!raw) return null;
    const lower = raw.toLowerCase();
    if (lower.includes("no se encontró ningún manuscrito") || lower.includes("no manuscript")) {
      return "No se encontró ningún manuscrito para este proyecto. Sube un manuscrito antes de ejecutar el análisis de AI.";
    }
    if (lower.includes("prompt") || lower.includes("editorial_ai_prompt_templates")) {
      return "No hay un prompt de AI configurado para esta etapa o tarea. Contacta con el equipo técnico para revisarlo.";
    }
    return raw;
  }

  async function loadState() {
    setLoadingState(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/process-manuscript`,
        { method: "GET" }
      );
      const data: StateResponse = await res.json();

      console.info("[editorial-ai][ui] loadState result", {
        ok: res.ok,
        status: res.status,
        hasLatestJob: !!data.latestJob,
      });

      if (!res.ok || !data.success) {
        setError(data.error ?? `Error al cargar AI Review (HTTP ${res.status})`);
        setStatus("idle");
        setAnalysis(null);
        setJobId(null);
        setLastRunAt(null);
        setRecentJobs([]);
        setLatestManuscriptVersion(null);
        setAnalyzedFileVersion(null);
        setIsOutdated(false);
        return;
      }

      const latestJob = data.latestJob;
      setRecentJobs(data.recentJobs ?? []);
      setAnalysis(data.latestAnalysis ?? null);
      setJobId(latestJob?.id ?? null);

      setLatestManuscriptVersion(data.latestManuscriptVersion ?? null);
      setAnalyzedFileVersion(data.analyzedFileVersion ?? null);
      setIsOutdated(Boolean(data.isOutdated));

      if (latestJob?.finishedAt) {
        setLastRunAt(new Date(latestJob.finishedAt));
      } else if (latestJob?.createdAt) {
        setLastRunAt(new Date(latestJob.createdAt));
      } else {
        setLastRunAt(null);
      }

      setStatus(computeStatusFromJob(latestJob));
    } catch (err) {
      console.error("[editorial-ai][ui] loadState error", err);
      setError("No se pudo cargar el estado de AI Review.");
      setStatus("idle");
      setAnalysis(null);
      setJobId(null);
      setLastRunAt(null);
      setRecentJobs([]);
      setLatestManuscriptVersion(null);
      setAnalyzedFileVersion(null);
      setIsOutdated(false);
    } finally {
      setLoadingState(false);
    }
  }

  useEffect(() => {
    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleProcess() {
    setStatus("processing");
    setError(null);

    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/process-manuscript`,
        {
          method: "POST",
        }
      );
      const data: ProcessResponse = await res.json();

      if (!res.ok || !data.success) {
        setStatus("failed");
        setError(data.error ?? `Error HTTP ${res.status}`);
        return;
      }

      console.info("[editorial-ai][ui] process POST success", {
        jobId: data.jobId,
      });

      // Rehidratamos estado desde backend para mantener una sola fuente de verdad.
      await loadState();
    } catch (err) {
      console.error("[editorial-ai][process] client error", err);
      setError("No se pudo procesar el manuscrito. Intenta nuevamente.");
      setStatus("failed");
    }
  }

  function renderStatusBadge() {
    if (status === "processing") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Procesando…
        </Badge>
      );
    }
    if (status === "completed") {
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Completado</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="outline">Idle</Badge>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-purple-500" />
            AI Review
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Análisis editorial automático del manuscrito más reciente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          <Button
            type="button"
            size="sm"
            onClick={handleProcess}
            disabled={status === "processing"}
            className="gap-2"
          >
            {status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "failed"
              ? "Reintentar análisis"
              : analysis
                ? "Reprocesar manuscrito"
                : "Procesar manuscrito"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-xs text-destructive">
            {getFriendlyError(error)}
          </p>
        )}

        {!error && !loadingState && latestManuscriptVersion == null && status !== "processing" && (
          <p className="text-xs text-muted-foreground">
            Aún no se ha subido ningún manuscrito para este proyecto. Sube un manuscrito original y luego ejecuta el análisis de AI.
          </p>
        )}

        {!error &&
          !loadingState &&
          latestManuscriptVersion != null &&
          !analysis &&
          status === "idle" && (
            <p className="text-xs text-muted-foreground">
              Hay un manuscrito disponible, pero todavía no se ha ejecutado ningún análisis editorial automático.
            </p>
          )}

        {latestManuscriptVersion != null && (
          <p className="text-xs text-muted-foreground">
            Versión actual del manuscrito:{" "}
            <span className="font-semibold">v{latestManuscriptVersion}</span>
            {analyzedFileVersion != null && (
              <>
                {" · "}Última versión analizada:{" "}
                <span className="font-semibold">v{analyzedFileVersion}</span>
              </>
            )}
          </p>
        )}

        {isOutdated && (
          <p className="text-xs font-medium text-amber-600">
            Hay una versión más reciente del manuscrito sin analizar. Ejecuta de nuevo el análisis
            para actualizar el AI Review.
          </p>
        )}

        {lastRunAt && (
          <p className="text-xs text-muted-foreground">
            Última ejecución{" "}
            {formatDistanceToNow(lastRunAt, { addSuffix: true, locale: es })}{" "}
            {jobId ? `(Job ${jobId})` : null}
          </p>
        )}

        {!analysis && status !== "processing" && !error && !loadingState && (
          <p className="text-xs text-muted-foreground">
            Aún no se ha ejecutado un análisis editorial automático para este proyecto.
          </p>
        )}

        {analysis && (
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">
              {(() => {
                const totalIssues =
                  (analysis.structural_issues?.length ?? 0) +
                  (analysis.style_issues?.length ?? 0) +
                  (analysis.grammar_issues?.length ?? 0);
                return (
                  <>
                    <span className="font-medium text-foreground">
                      Resumen del análisis:
                    </span>{" "}
                    {`readiness_score ${analysis.readiness_score}/100 · ${totalIssues} incidencias detectadas en estructura, estilo y ortotipografía.`}
                  </>
                );
              })()}
            </div>

            <div>
              <h3 className="font-medium">Resumen editorial</h3>
              <p className="mt-1 text-muted-foreground whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="font-medium">Fortalezas</h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                  {analysis.strengths.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Problemas estructurales</h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                  {analysis.structural_issues.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="font-medium">Problemas de estilo</h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                  {analysis.style_issues.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Problemas gramaticales / ortotipográficos</h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                  {analysis.grammar_issues.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Recomendaciones</h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                {analysis.recommendations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Readiness score</h3>
              <p className="mt-1 text-muted-foreground">
                Puntuación de preparación editorial:{" "}
                <span className="font-semibold">{analysis.readiness_score}/100</span>
              </p>
            </div>
          </div>
        )}

        {recentJobs.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-xs font-medium text-foreground">Historial reciente</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px]">
                    {job.id.slice(0, 8)}… ({job.status})
                  </span>
                  <span className="flex items-center gap-2">
                    {job.readiness_score != null && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                        {job.readiness_score}/100
                      </span>
                    )}
                    {job.finishedAt && (
                      <span>
                        {formatDistanceToNow(new Date(job.finishedAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    )}
                    {job.error && job.status === "failed" && (
                      <span className="text-destructive">
                        {job.error.slice(0, 80)}
                        {job.error.length > 80 ? "…" : ""}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

