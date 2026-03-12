"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  DollarSign
} from "lucide-react";
import {
  DISTRIBUTION_CHANNEL_LABELS,
  DISTRIBUTION_STATUS_LABELS,
  DEFAULT_CHANNEL_CONFIGS,
  type DistributionChannel,
  type ProjectDistribution,
} from "@/lib/editorial/distribution/types";
import type { StageWithApprover } from "@/lib/editorial/types/editorial";
import type { EditorialExportJob } from "@/lib/editorial/export/types";

interface StageDistributionPanelProps {
  projectId: string;
  stage: StageWithApprover;
  distributions: ProjectDistribution[];
  exports: EditorialExportJob[];
  onDistributionCreated?: () => void;
}

const AVAILABLE_CHANNELS: DistributionChannel[] = [
  "amazon_kdp",
  "apple_books",
  "google_play",
  "kobo",
  "direct_sale",
];

export function StageDistributionPanel({ 
  projectId, 
  stage, 
  distributions,
  exports,
  onDistributionCreated 
}: StageDistributionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedChannels, setSelectedChannels] = useState<DistributionChannel[]>([]);
  const [price, setPrice] = useState<string>("9.99");
  const [currency, setCurrency] = useState<string>("USD");
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const completedExports = exports.filter(e => e.status === "completed");

  function toggleChannel(channel: DistributionChannel) {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  }

  async function handleCreateDistributions() {
    if (selectedChannels.length === 0) {
      setError("Selecciona al menos un canal de distribucion");
      return;
    }

    if (completedExports.length === 0) {
      setError("No hay exports completados. Genera los exports primero.");
      return;
    }

    setError(null);
    setSuccessCount(0);
    
    startTransition(async () => {
      try {
        let created = 0;
        const exportId = completedExports[0].id; // Use first completed export
        
        for (const channel of selectedChannels) {
          const res = await fetch(
            `/api/editorial/projects/${projectId}/distributions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channel,
                exportId,
                price: parseFloat(price) || 9.99,
                currency,
                regions: DEFAULT_CHANNEL_CONFIGS[channel]?.defaultRegions || ["worldwide"],
                metadata: {},
              }),
            }
          );
          const json = await res.json();

          if (json.distribution) {
            created++;
          }
        }

        setSuccessCount(created);
        setSelectedChannels([]);
        router.refresh();
        onDistributionCreated?.();
      } catch {
        setError("Error al crear las distribuciones");
      }
    });
  }

  async function handleCompleteProject() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/distribution/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Proyecto completado y distribuido" }),
          }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "No se pudo completar el proyecto.");
          return;
        }

        router.refresh();
      } catch {
        setError("Error de red al completar el proyecto.");
      }
    });
  }

  const isApproved = stage.status === "approved" || stage.status === "completed";
  const hasDistributions = distributions.length > 0;
  const liveDistributions = distributions.filter(d => d.status === "live" || d.status === "submitted");

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Distribucion</CardTitle>
          </div>
          <Badge 
            variant={isApproved ? "default" : "secondary"}
            className={isApproved ? "bg-emerald-600" : ""}
          >
            {isApproved ? "Completado" : "En proceso"}
          </Badge>
        </div>
        <CardDescription>
          Configura los canales de venta y distribucion
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
        {successCount > 0 && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successCount} canal(es) configurados</span>
            </div>
          </div>
        )}

        {/* No exports warning */}
        {completedExports.length === 0 && !isApproved && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Genera y completa los exports antes de distribuir.</span>
            </div>
          </div>
        )}

        {/* Channel selection */}
        {!isApproved && completedExports.length > 0 && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Canales de distribucion</Label>
              <div className="space-y-2">
                {AVAILABLE_CHANNELS.map((channel) => {
                  const config = DEFAULT_CHANNEL_CONFIGS[channel];
                  const alreadyConfigured = distributions.some(d => d.channel === channel);
                  
                  return (
                    <div
                      key={channel}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        alreadyConfigured 
                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 opacity-60"
                          : selectedChannels.includes(channel)
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                            : "border-border hover:border-emerald-300 cursor-pointer"
                      }`}
                      onClick={() => !alreadyConfigured && toggleChannel(channel)}
                    >
                      <Checkbox
                        checked={selectedChannels.includes(channel) || alreadyConfigured}
                        disabled={alreadyConfigured}
                        onCheckedChange={() => !alreadyConfigured && toggleChannel(channel)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {DISTRIBUTION_CHANNEL_LABELS[channel]}
                          {alreadyConfigured && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Configurado
                            </Badge>
                          )}
                        </p>
                        {config && (
                          <p className="text-xs text-muted-foreground">
                            Formatos: {config.supportedFormats.join(", ").toUpperCase()} - 
                            Comision: {config.commissionPercent}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            {selectedChannels.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Precio de venta</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-9"
                      placeholder="9.99"
                    />
                  </div>
                  <Input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="w-20"
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Configured distributions list */}
        {hasDistributions && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Distribuciones configuradas ({distributions.length})
            </Label>
            <div className="space-y-2">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {DISTRIBUTION_CHANNEL_LABELS[dist.channel]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dist.price ? `${dist.currency} ${dist.price}` : "Precio no definido"} - 
                        {" "}{dist.regions.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={dist.status === "live" ? "default" : "secondary"}
                      className={dist.status === "live" ? "bg-emerald-600" : ""}
                    >
                      {DISTRIBUTION_STATUS_LABELS[dist.status]}
                    </Badge>
                    {dist.external_url && (
                      <a 
                        href={dist.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed state */}
        {isApproved && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium">Proyecto Completado</p>
                <p className="text-sm opacity-80">
                  El libro ha sido publicado y esta disponible en los canales configurados.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {!isApproved && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          {selectedChannels.length > 0 && (
            <Button
              variant="outline"
              onClick={handleCreateDistributions}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Configurar Canales
            </Button>
          )}
          {hasDistributions && (
            <Button
              onClick={handleCompleteProject}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Completar Proyecto
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
