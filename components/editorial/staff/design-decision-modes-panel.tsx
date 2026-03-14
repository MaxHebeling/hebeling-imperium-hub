"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings2,
  Save,
  Loader2,
  Palette,
  Layout,
  Type,
  Sparkles,
  Shield,
  Eye,
} from "lucide-react";

interface DesignDecisionConfig {
  coverMode: "ai_generated" | "manual_upload" | "template";
  interiorMode: "automated" | "semi_manual" | "full_manual";
  typographyPreset: "classic" | "modern" | "elegant" | "custom";
  colorScheme: "neutral" | "warm" | "cool" | "brand";
  aiAssistLevel: "full" | "suggestions_only" | "disabled";
  autoApproveStages: boolean;
  requireClientApproval: boolean;
  showAiConfidence: boolean;
  enableBatchProcessing: boolean;
  defaultExportFormats: string[];
  qualityCheckLevel: "strict" | "standard" | "relaxed";
}

const DEFAULT_DESIGN_CONFIG: DesignDecisionConfig = {
  coverMode: "ai_generated",
  interiorMode: "automated",
  typographyPreset: "classic",
  colorScheme: "neutral",
  aiAssistLevel: "full",
  autoApproveStages: false,
  requireClientApproval: true,
  showAiConfidence: true,
  enableBatchProcessing: true,
  defaultExportFormats: ["pdf_print", "epub"],
  qualityCheckLevel: "standard",
};

export function DesignDecisionModesPanel() {
  const [config, setConfig] = useState<DesignDecisionConfig>({ ...DEFAULT_DESIGN_CONFIG });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch("/api/staff/settings/design-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Modos de Decision de Diseno</CardTitle>
            </div>
            {saved && <Badge className="bg-emerald-500/10 text-emerald-600">Guardado</Badge>}
          </div>
          <CardDescription>
            Configura como se toman las decisiones de diseno en los proyectos editoriales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Design Modes */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Modos de diseno
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Modo de portada</Label>
                <Select value={config.coverMode} onValueChange={(v) => setConfig({ ...config, coverMode: v as DesignDecisionConfig["coverMode"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_generated">Generada por IA</SelectItem>
                    <SelectItem value="manual_upload">Subida manual</SelectItem>
                    <SelectItem value="template">Desde plantilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Modo de interior</Label>
                <Select value={config.interiorMode} onValueChange={(v) => setConfig({ ...config, interiorMode: v as DesignDecisionConfig["interiorMode"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automated">Automatizado</SelectItem>
                    <SelectItem value="semi_manual">Semi-manual</SelectItem>
                    <SelectItem value="full_manual">Completamente manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Typography & Colors */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tipografia y colores
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Preset tipografico</Label>
                <Select value={config.typographyPreset} onValueChange={(v) => setConfig({ ...config, typographyPreset: v as DesignDecisionConfig["typographyPreset"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Clasico (Garamond)</SelectItem>
                    <SelectItem value="modern">Moderno (Inter)</SelectItem>
                    <SelectItem value="elegant">Elegante (Baskerville)</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Esquema de color</Label>
                <Select value={config.colorScheme} onValueChange={(v) => setConfig({ ...config, colorScheme: v as DesignDecisionConfig["colorScheme"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="warm">Calido</SelectItem>
                    <SelectItem value="cool">Frio</SelectItem>
                    <SelectItem value="brand">Marca (Hebeling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Configuration */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Asistencia IA
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Nivel de asistencia IA</Label>
                <Select value={config.aiAssistLevel} onValueChange={(v) => setConfig({ ...config, aiAssistLevel: v as DesignDecisionConfig["aiAssistLevel"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Completa (automatiza donde pueda)</SelectItem>
                    <SelectItem value="suggestions_only">Solo sugerencias</SelectItem>
                    <SelectItem value="disabled">Deshabilitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nivel de calidad</Label>
                <Select value={config.qualityCheckLevel} onValueChange={(v) => setConfig({ ...config, qualityCheckLevel: v as DesignDecisionConfig["qualityCheckLevel"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Estricto</SelectItem>
                    <SelectItem value="standard">Estandar</SelectItem>
                    <SelectItem value="relaxed">Relajado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Workflow Toggles */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Flujo de trabajo
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Auto-aprobar etapas IA</Label>
                <Switch checked={config.autoApproveStages} onCheckedChange={(v) => setConfig({ ...config, autoApproveStages: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Requerir aprobacion del cliente</Label>
                <Switch checked={config.requireClientApproval} onCheckedChange={(v) => setConfig({ ...config, requireClientApproval: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Mostrar confianza de IA</Label>
                <Switch checked={config.showAiConfidence} onCheckedChange={(v) => setConfig({ ...config, showAiConfidence: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Procesamiento por lotes</Label>
                <Switch checked={config.enableBatchProcessing} onCheckedChange={(v) => setConfig({ ...config, enableBatchProcessing: v })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveConfig} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
