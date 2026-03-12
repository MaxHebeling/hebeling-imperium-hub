"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Clock,
  ArrowRight,
  Loader2,
  Play
} from "lucide-react";
import { EDITORIAL_STAGE_LABELS, EDITORIAL_STAGE_PROGRESS } from "@/lib/editorial/pipeline/constants";
import type { EditorialFile, EditorialStageKey, StageWithApprover } from "@/lib/editorial/types/editorial";

interface StageReviewPanelProps {
  projectId: string;
  stage: StageWithApprover;
  nextStageKey: EditorialStageKey | null;
  files: EditorialFile[];
  onApproved?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  queued: { label: "En cola", variant: "outline" },
  processing: { label: "En proceso", variant: "default" },
  review_required: { label: "Revisión requerida", variant: "destructive" },
  approved: { label: "Aprobado", variant: "default" },
  failed: { label: "Error", variant: "destructive" },
  completed: { label: "Completado", variant: "secondary" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StageReviewPanel({
  projectId,
  stage,
  nextStageKey,
  files,
  onApproved,
}: StageReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const stageKey = stage.stage_key;
  const stageLabel = EDITORIAL_STAGE_LABELS[stageKey];
  const stageProgress = EDITORIAL_STAGE_PROGRESS[stageKey];
  const nextStageLabel = nextStageKey ? EDITORIAL_STAGE_LABELS[nextStageKey] : null;
  const statusConfig = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.pending;

  // Filter files for this stage
  const stageFiles = files.filter((f) => f.stage_key === stageKey || (stageKey === "ingesta" && f.file_type === "manuscript_original"));

  const canApprove = stage.status !== "approved" && stage.status !== "completed" && stage.status !== "pending";
  const isApproved = stage.status === "approved" || stage.status === "completed";
  const needsStart = stage.status === "pending";
  const isProcessing = stage.status === "processing" || stage.status === "queued";

  async function handleApprove() {
    setError(null);
    setValidationErrors([]);
    
    startTransition(async () => {
      try {
        // Add note if provided
        if (notes.trim()) {
          await fetch(`/api/staff/projects/${projectId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stageKey,
              comment: notes.trim(),
              visibility: "internal",
            }),
          });
        }

        // Approve the stage
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/${stageKey}/approve`,
          { method: "POST" }
        );
        const json = await res.json();

        if (!json.success) {
          if (json.reasons && Array.isArray(json.reasons)) {
            setValidationErrors(json.reasons.map((r: { message: string }) => r.message));
          }
          setError(json.error ?? "No se pudo aprobar la etapa.");
          return;
        }

        setNotes("");
        router.refresh();
        onApproved?.();
      } catch {
        setError("Error de red al aprobar la etapa.");
      }
    });
  }

  async function handleReject() {
    if (!notes.trim()) {
      setError("Por favor, indica el motivo del rechazo en las notas.");
      return;
    }
    
    setError(null);
    startTransition(async () => {
      try {
        // Use the reject API endpoint
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/${stageKey}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: notes.trim() }),
          }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "No se pudo rechazar la etapa.");
          return;
        }

        setNotes("");
        router.refresh();
      } catch {
        setError("Error de red al rechazar la etapa.");
      }
    });
  }

  async function handleStart() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/${stageKey}/start`,
          { method: "POST" }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "No se pudo iniciar la etapa.");
          return;
        }

        router.refresh();
      } catch {
        setError("Error de red al iniciar la etapa.");
      }
    });
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{stageLabel}</CardTitle>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <CardDescription>
              Revisa y aprueba esta etapa para avanzar al siguiente paso del proceso editorial.
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Progreso: {stageProgress}%</div>
            <Progress value={stageProgress} className="mt-1 h-2 w-24" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stage Timeline */}
        <div className="flex flex-wrap gap-4 text-sm">
          {stage.started_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Iniciado: {formatDate(stage.started_at)}</span>
            </div>
          )}
          {stage.completed_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Completado: {formatDate(stage.completed_at)}</span>
            </div>
          )}
          {stage.approved_by_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Por: {stage.approved_by_name}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Files Section */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Archivos de esta etapa ({stageFiles.length})
          </h4>
          {stageFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay archivos asociados a esta etapa.
            </p>
          ) : (
            <ul className="space-y-1">
              {stageFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between text-sm rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{file.file_type}</span>
                    <Badge variant="outline" className="text-xs">v{file.version}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg bg-destructive/10 p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              No se puede completar la etapa:
            </div>
            <ul className="ml-6 list-disc text-sm text-destructive">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Display */}
        {error && !validationErrors.length && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Notes Section */}
        {canApprove && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notas de revisión (opcional)
            </label>
            <Textarea
              placeholder="Agrega comentarios o notas sobre esta etapa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {/* Next Stage Preview */}
        {nextStageKey && canApprove && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>Al aprobar, el proyecto avanzara a: </span>
              <Badge variant="default">{nextStageLabel}</Badge>
            </div>
          </div>
        )}

        {/* Already Approved State */}
        {isApproved && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Esta etapa ya ha sido aprobada.</span>
            </div>
          </div>
        )}

        {/* Pending State - needs to be started */}
        {needsStart && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span>Esta etapa esta pendiente de iniciar. Haz clic en "Iniciar Etapa" para comenzar el trabajo.</span>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Esta etapa esta en proceso. Revisa cuando estes listo para aprobar o rechazar.</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer for pending stages */}
      {needsStart && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button
            onClick={handleStart}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Iniciar Etapa
          </Button>
        </CardFooter>
      )}

      {canApprove && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Rechazar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Aprobar y Avanzar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
