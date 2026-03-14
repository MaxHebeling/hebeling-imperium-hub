"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  LayoutTemplate,
  Type,
  Columns,
  Save,
  Loader2,
  Eye,
  RotateCcw,
} from "lucide-react";

interface InteriorDesignConfig {
  trimSize: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margins: { top: number; bottom: number; inner: number; outer: number };
  chapterStartPage: "right" | "any";
  dropCaps: boolean;
  headerFooter: boolean;
  orphanWidowControl: boolean;
  paragraphIndent: number;
  sectionBreakStyle: "asterisks" | "line" | "space" | "ornament";
}

const TRIM_SIZES = [
  { value: "5x8", label: "5\" x 8\" (Novela estandar)" },
  { value: "5.25x8", label: "5.25\" x 8\" (Novela)" },
  { value: "5.5x8.5", label: "5.5\" x 8.5\" (Novela grande)" },
  { value: "6x9", label: "6\" x 9\" (No ficcion)" },
  { value: "7x10", label: "7\" x 10\" (Libro de texto)" },
  { value: "8.5x11", label: "8.5\" x 11\" (Carta)" },
];

const FONT_FAMILIES = [
  { value: "garamond", label: "EB Garamond" },
  { value: "minion", label: "Minion Pro" },
  { value: "caslon", label: "Adobe Caslon" },
  { value: "baskerville", label: "Libre Baskerville" },
  { value: "palatino", label: "Palatino" },
  { value: "georgia", label: "Georgia" },
  { value: "times", label: "Times New Roman" },
];

const DEFAULT_CONFIG: InteriorDesignConfig = {
  trimSize: "5.5x8.5",
  fontFamily: "garamond",
  fontSize: 11,
  lineHeight: 1.5,
  margins: { top: 0.75, bottom: 0.75, inner: 0.85, outer: 0.65 },
  chapterStartPage: "right",
  dropCaps: true,
  headerFooter: true,
  orphanWidowControl: true,
  paragraphIndent: 0.3,
  sectionBreakStyle: "asterisks",
};

interface InteriorDesignPanelProps {
  projectId: string;
}

export function InteriorDesignPanel({ projectId }: InteriorDesignPanelProps) {
  const [config, setConfig] = useState<InteriorDesignConfig>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch(`/api/staff/projects/${projectId}/interior-design`, {
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
              <LayoutTemplate className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Diseno Interior</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {saved && <Badge className="bg-emerald-500/10 text-emerald-600">Guardado</Badge>}
              <Button size="sm" variant="outline" onClick={() => setConfig({ ...DEFAULT_CONFIG })} className="gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
          <CardDescription>
            Configuracion tipografica y de maquetacion para el interior del libro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Page Setup */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Pagina
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Tamano de corte</Label>
                <Select value={config.trimSize} onValueChange={(v) => setConfig({ ...config, trimSize: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIM_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Inicio de capitulo</Label>
                <Select value={config.chapterStartPage} onValueChange={(v) => setConfig({ ...config, chapterStartPage: v as "right" | "any" })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Pagina derecha</SelectItem>
                    <SelectItem value="any">Cualquier pagina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Margins */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Margenes (pulgadas)</h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {(["top", "bottom", "inner", "outer"] as const).map((side) => (
                <div key={side} className="space-y-1">
                  <Label className="text-xs capitalize">{side === "top" ? "Superior" : side === "bottom" ? "Inferior" : side === "inner" ? "Interior" : "Exterior"}</Label>
                  <Input
                    type="number"
                    step={0.05}
                    min={0.3}
                    max={2}
                    value={config.margins[side]}
                    onChange={(e) => setConfig({ ...config, margins: { ...config.margins, [side]: parseFloat(e.target.value) || 0 } })}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Typography */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tipografia
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Fuente principal</Label>
                <Select value={config.fontFamily} onValueChange={(v) => setConfig({ ...config, fontFamily: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tamano de fuente: {config.fontSize}pt</Label>
                <Slider
                  value={[config.fontSize]}
                  onValueChange={([v]) => setConfig({ ...config, fontSize: v })}
                  min={9}
                  max={14}
                  step={0.5}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Interlineado: {config.lineHeight}</Label>
                <Slider
                  value={[config.lineHeight]}
                  onValueChange={([v]) => setConfig({ ...config, lineHeight: v })}
                  min={1.2}
                  max={2}
                  step={0.05}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Sangria de parrafo: {config.paragraphIndent}in</Label>
                <Slider
                  value={[config.paragraphIndent]}
                  onValueChange={([v]) => setConfig({ ...config, paragraphIndent: v })}
                  min={0}
                  max={0.5}
                  step={0.05}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Formatting Options */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Opciones de formato</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Capitulares (drop caps)</Label>
                <Switch checked={config.dropCaps} onCheckedChange={(v) => setConfig({ ...config, dropCaps: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Encabezado / pie de pagina</Label>
                <Switch checked={config.headerFooter} onCheckedChange={(v) => setConfig({ ...config, headerFooter: v })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Control de viudas/huerfanas</Label>
                <Switch checked={config.orphanWidowControl} onCheckedChange={(v) => setConfig({ ...config, orphanWidowControl: v })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Separador de secciones</Label>
                <Select value={config.sectionBreakStyle} onValueChange={(v) => setConfig({ ...config, sectionBreakStyle: v as InteriorDesignConfig["sectionBreakStyle"] })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asterisks">Asteriscos (***)</SelectItem>
                    <SelectItem value="line">Linea horizontal</SelectItem>
                    <SelectItem value="space">Espacio en blanco</SelectItem>
                    <SelectItem value="ornament">Ornamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
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
