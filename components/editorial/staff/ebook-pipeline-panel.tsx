"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Play,
  Settings2,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import {
  EBOOK_STAGE_KEYS,
  EBOOK_STAGE_LABELS,
  EBOOK_STAGE_PROGRESS,
  OUTPUT_MODE_LABELS,
  EBOOK_TYPE_LABELS,
  EBOOK_DESTINATION_LABELS,
  EBOOK_ORIGIN_LABELS,
  DEFAULT_EBOOK_CONFIG,
} from "@/lib/editorial/ebook/types";
import type {
  ProjectOutputMode,
  EbookType,
  EbookDestination,
  EbookOrigin,
  EbookStageKey,
  EbookStageStatus,
  EbookProjectConfig,
} from "@/lib/editorial/ebook/types";

interface EbookPipelinePanelProps {
  projectId: string;
}

interface EbookStageState {
  stageKey: EbookStageKey;
  status: EbookStageStatus;
  startedAt: string | null;
  completedAt: string | null;
}

const STATUS_COLORS: Record<EbookStageStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-200",
  review_required: "bg-amber-500/10 text-amber-600 border-amber-200",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const STATUS_LABELS_ES: Record<EbookStageStatus, string> = {
  pending: "Pendiente",
  in_progress: "En proceso",
  review_required: "Revision requerida",
  approved: "Aprobado",
  failed: "Error",
  completed: "Completado",
};

function StageIcon({ status }: { status: EbookStageStatus }) {
  if (status === "completed" || status === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "in_progress") return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (status === "review_required") return <Clock className="h-4 w-4 text-amber-500" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export function EbookPipelinePanel({ projectId }: EbookPipelinePanelProps) {
  const router = useRouter();
  const [config, setConfig] = useState<EbookProjectConfig>({ ...DEFAULT_EBOOK_CONFIG });
  const [stages, setStages] = useState<EbookStageState[]>([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [showConfig, setShowConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function initializePipeline() {
    setError(null);
    setPipelineRunning(true);
    setPipelineStatus("running");
    setShowConfig(false);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/ebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize", config }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Error al inicializar el pipeline eBook");
      }

      const initialStages: EbookStageState[] = EBOOK_STAGE_KEYS.map((key, i) => ({
        stageKey: key,
        status: i === 0 ? "in_progress" : "pending",
        startedAt: i === 0 ? new Date().toISOString() : null,
        completedAt: null,
      }));

      setStages(initialStages);
      setProgress(0);

      for (let i = 0; i < EBOOK_STAGE_KEYS.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setStages((prev) =>
          prev.map((s, idx) => {
            if (idx === i) return { ...s, status: "completed", completedAt: new Date().toISOString() };
            if (idx === i + 1) return { ...s, status: "in_progress", startedAt: new Date().toISOString() };
            return s;
          })
        );
        setProgress(EBOOK_STAGE_PROGRESS[EBOOK_STAGE_KEYS[i]]);
      }

      setPipelineStatus("completed");
      setProgress(100);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPipelineStatus("failed");
    } finally {
      setPipelineRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Produccion eBook</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {pipelineStatus === "completed" && (
                <Badge className="bg-emerald-500/10 text-emerald-600">Pipeline completado</Badge>
              )}
              {pipelineStatus === "running" && (
                <Badge className="bg-blue-500/10 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Procesando
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={() => setShowConfig(!showConfig)}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Configura el modo de salida y ejecuta el pipeline de produccion eBook.
          </CardDescription>
        </CardHeader>

        {showConfig && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Modo de salida</Label>
                <Select value={config.outputMode} onValueChange={(v) => setConfig({ ...config, outputMode: v as ProjectOutputMode })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(OUTPUT_MODE_LABELS) as ProjectOutputMode[]).map((key) => (
                      <SelectItem key={key} value={key}>{OUTPUT_MODE_LABELS[key].es}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo de eBook</Label>
                <Select value={config.ebookType} onValueChange={(v) => setConfig({ ...config, ebookType: v as EbookType })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EBOOK_TYPE_LABELS) as EbookType[]).map((key) => (
                      <SelectItem key={key} value={key}>{EBOOK_TYPE_LABELS[key].es}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Plataforma destino</Label>
                <Select value={config.destination} onValueChange={(v) => setConfig({ ...config, destination: v as EbookDestination })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EBOOK_DESTINATION_LABELS) as EbookDestination[]).map((key) => (
                      <SelectItem key={key} value={key}>{EBOOK_DESTINATION_LABELS[key].es}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Origen</Label>
                <Select value={config.origin} onValueChange={(v) => setConfig({ ...config, origin: v as EbookOrigin })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EBOOK_ORIGIN_LABELS) as EbookOrigin[]).map((key) => (
                      <SelectItem key={key} value={key}>{EBOOK_ORIGIN_LABELS[key].es}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Incluir dedicatoria</Label>
                <Switch checked={config.includeDedication} onCheckedChange={(v) => setConfig({ ...config, includeDedication: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Incluir agradecimientos</Label>
                <Switch checked={config.includeAcknowledgments} onCheckedChange={(v) => setConfig({ ...config, includeAcknowledgments: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Incluir biografia del autor</Label>
                <Switch checked={config.includeAuthorBio} onCheckedChange={(v) => setConfig({ ...config, includeAuthorBio: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Incluir material final</Label>
                <Switch checked={config.includeBackMatter} onCheckedChange={(v) => setConfig({ ...config, includeBackMatter: v })} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={initializePipeline} disabled={pipelineRunning} className="gap-2">
                {pipelineRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {pipelineRunning ? "Procesando..." : "Iniciar Pipeline eBook"}
              </Button>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
          </CardContent>
        )}
      </Card>

      {stages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Pipeline de Produccion
              </CardTitle>
              <span className="text-sm font-semibold text-primary">{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0">
              {stages.map((stage, i) => {
                const label = EBOOK_STAGE_LABELS[stage.stageKey];
                const isLast = i === stages.length - 1;
                return (
                  <li key={stage.stageKey} className={`flex items-center justify-between gap-2 py-3 ${!isLast ? "border-b border-border/50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <StageIcon status={stage.status} />
                      <div>
                        <p className="text-sm font-medium">{label.es}</p>
                        {stage.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(stage.completedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-xs ${STATUS_COLORS[stage.status]}`}>{STATUS_LABELS_ES[stage.status]}</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {pipelineStatus === "completed" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Archivos de Exportacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ebook.epub</span>
                </div>
                <Badge variant="secondary">Listo</Badge>
              </div>
              {(config.destination === "amazon_kdp" || config.destination === "both") && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ebook.kpf</span>
                  </div>
                  <Badge variant="secondary">Listo</Badge>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ebook-preview.html</span>
                </div>
                <Badge variant="secondary">Listo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
