"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette,
  Save,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface CompanyAccentColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

const PRESET_THEMES: { name: string; colors: CompanyAccentColors }[] = [
  {
    name: "Hebeling OS (Default)",
    colors: {
      primary: "#C8A75B",
      secondary: "#6E1F2F",
      accent: "#2F6FA3",
      background: "#0B1420",
      surface: "#162235",
      text: "#E8E0D0",
    },
  },
  {
    name: "Oceano Azul",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#0F172A",
      surface: "#1E293B",
      text: "#E2E8F0",
    },
  },
  {
    name: "Bosque Verde",
    colors: {
      primary: "#22C55E",
      secondary: "#166534",
      accent: "#4ADE80",
      background: "#0C1A12",
      surface: "#14291E",
      text: "#D1FAE5",
    },
  },
  {
    name: "Atardecer Calido",
    colors: {
      primary: "#F59E0B",
      secondary: "#B45309",
      accent: "#FBBF24",
      background: "#1C1208",
      surface: "#2D1F0E",
      text: "#FEF3C7",
    },
  },
  {
    name: "Purpura Regio",
    colors: {
      primary: "#A855F7",
      secondary: "#7E22CE",
      accent: "#C084FC",
      background: "#13091F",
      surface: "#1E1333",
      text: "#E9D5FF",
    },
  },
];

interface CompanyAccentConfigProps {
  companyId: string;
  initialColors?: Partial<CompanyAccentColors>;
}

export function CompanyAccentConfig({ companyId, initialColors }: CompanyAccentConfigProps) {
  const defaultColors = PRESET_THEMES[0].colors;
  const [colors, setColors] = useState<CompanyAccentColors>({ ...defaultColors, ...initialColors });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>("Hebeling OS (Default)");

  function applyPreset(preset: typeof PRESET_THEMES[0]) {
    setColors({ ...preset.colors });
    setActivePreset(preset.name);
  }

  function updateColor(key: keyof CompanyAccentColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }

  async function saveColors() {
    setSaving(true);
    try {
      await fetch(`/api/staff/companies/${companyId}/accent-colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
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
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Colores de la Empresa</CardTitle>
            </div>
            {saved && <Badge className="bg-emerald-500/10 text-emerald-600">Guardado</Badge>}
          </div>
          <CardDescription>
            Personaliza los colores de acento para el espacio de trabajo de esta empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div>
            <Label className="text-xs font-semibold mb-2 block">Temas predefinidos</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_THEMES.map((preset) => (
                <Button
                  key={preset.name}
                  variant={activePreset === preset.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="gap-2 h-8 text-xs"
                >
                  <div
                    className="h-3 w-3 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {(Object.entries(colors) as [keyof CompanyAccentColors, string][]).map(([key, value]) => {
              const labels: Record<keyof CompanyAccentColors, string> = {
                primary: "Primario",
                secondary: "Secundario",
                accent: "Acento",
                background: "Fondo",
                surface: "Superficie",
                text: "Texto",
              };
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{labels[key]}</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="h-8 w-8 rounded-md border border-border cursor-pointer"
                      />
                    </div>
                    <Input
                      value={value}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="h-8 text-xs font-mono flex-1"
                      maxLength={7}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div>
            <Label className="text-xs font-semibold mb-2 block">Vista previa</Label>
            <div
              className="rounded-lg p-4 space-y-2"
              style={{ backgroundColor: colors.background }}
            >
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: colors.surface }}
              >
                <p className="text-sm font-semibold" style={{ color: colors.primary }}>
                  Titulo del Proyecto
                </p>
                <p className="text-xs mt-1" style={{ color: colors.text }}>
                  Descripcion del proyecto editorial con los colores seleccionados.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: colors.primary + "20", color: colors.primary }}
                  >
                    En progreso
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: colors.secondary + "20", color: colors.secondary }}
                  >
                    Editorial
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: colors.accent + "20", color: colors.accent }}
                  >
                    IA Activa
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => applyPreset(PRESET_THEMES[0])} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button onClick={saveColors} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar colores"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
