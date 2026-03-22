"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Download, Eye, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialWorkflowStageKey } from "@/lib/editorial/types/stage-engine";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

interface RecoveryData {
  project: {
    id: string;
    title: string;
    author_name: string | null;
    current_stage: EditorialStageKey;
    status: string;
    progress_percent: number | null;
  };
  currentStageWorkspace?: {
    workflow_stage_key: EditorialWorkflowStageKey;
    latest_file: {
      id: string;
      storage_path: string | null;
      created_at: string | null;
      size_bytes: number | null;
    } | null;
  };
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileName(storagePath: string | null) {
  if (!storagePath) return "Archivo sin nombre";
  return storagePath.split("/").pop() || storagePath;
}

export default function EditorialProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(true);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecoveryData() {
      if (!projectId) return;
      setLoading(true);
      setRecoveryError(null);

      try {
        const res = await fetch(`/api/editorial/projects/${projectId}/progress`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (cancelled) return;

        if (json.success) {
          setRecoveryData({
            project: json.project,
            currentStageWorkspace: json.currentStageWorkspace,
          });
        } else {
          setRecoveryError(json.error ?? "No se pudo cargar el proyecto en modo de recuperacion.");
        }
      } catch {
        if (!cancelled) {
          setRecoveryError("No se pudo cargar el proyecto en modo de recuperacion.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecoveryData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const latestFile = recoveryData?.currentStageWorkspace?.latest_file ?? null;
  const latestFileViewUrl = latestFile ? `/api/editorial/files/${latestFile.id}/view` : null;
  const latestFileDownloadUrl = latestFile ? `/api/editorial/files/${latestFile.id}/download` : null;

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto">
      <Link href="/app/editorial/projects" className="inline-flex items-center gap-2 text-sm w-fit text-muted-foreground">
        <ArrowLeft className="w-4 h-4" />
        Volver a proyectos
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Recuperacion del proyecto editorial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta vista evita la pantalla en blanco mientras termino de blindar la interfaz premium del proyecto.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando proyecto...
            </div>
          ) : recoveryError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {recoveryError}
            </div>
          ) : recoveryData ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-lg font-semibold">{recoveryData.project.title}</p>
                {recoveryData.project.author_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    por {recoveryData.project.author_name}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1">
                    Estado: {recoveryData.project.status}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    Etapa: {EDITORIAL_STAGE_LABELS[recoveryData.project.current_stage] ?? recoveryData.project.current_stage}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    Progreso: {recoveryData.project.progress_percent ?? 0}%
                  </span>
                  {recoveryData.currentStageWorkspace?.workflow_stage_key && (
                    <span className="rounded-full bg-muted px-3 py-1">
                      Workflow IA: {recoveryData.currentStageWorkspace.workflow_stage_key}
                    </span>
                  )}
                </div>
              </div>

              {latestFile ? (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">Archivo vigente</p>
                  <p className="text-sm mt-2">{getFileName(latestFile.storage_path)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(latestFile.size_bytes)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {latestFileViewUrl && (
                      <a
                        href={latestFileViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Abrir archivo
                      </a>
                    )}
                    {latestFileDownloadUrl && (
                      <a
                        href={latestFileDownloadUrl}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  El proyecto cargo, pero esta etapa todavia no tiene archivo vigente visible.
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar vista premium
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/editorial/projects">Ir a lista de proyectos</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Referencia tecnica: {error.digest ?? error.message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
