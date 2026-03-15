"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, BookOpen, Ruler } from "lucide-react";
import { KDP_TRIM_SIZES, KDP_PAPER_SPECS, KDP_BINDING_LABELS, KDP_BLEED_LABELS } from "@/lib/editorial/kdp/constants";
import type { BookSpecifications } from "@/lib/editorial/types/workflow";
import type { KdpPaperType, KdpBindingType, KdpBleedOption } from "@/lib/editorial/kdp/types";

interface BookSpecsPanelProps {
  projectId: string;
}

export function BookSpecsPanel({ projectId }: BookSpecsPanelProps) {
  const [specs, setSpecs] = useState<BookSpecifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [trimSizeId, setTrimSizeId] = useState("6x9");
  const [printType, setPrintType] = useState("black_and_white");
  const [paperType, setPaperType] = useState<KdpPaperType>("cream");
  const [binding, setBinding] = useState<KdpBindingType>("paperback");
  const [bleed, setBleed] = useState<KdpBleedOption>("no_bleed");
  const [fontSize, setFontSize] = useState(11);
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [marginTop, setMarginTop] = useState(0.75);
  const [marginBottom, setMarginBottom] = useState(0.75);
  const [marginInner, setMarginInner] = useState(0.875);
  const [marginOuter, setMarginOuter] = useState(0.5);
  const [wordCount, setWordCount] = useState<number | "">("");

  const fetchSpecs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/workflow/book-specs`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const s = json.data as BookSpecifications;
        setSpecs(s);
        setTrimSizeId(s.trim_size_id);
        setPrintType(s.print_type);
        setPaperType(s.paper_type as KdpPaperType);
        setBinding(s.binding as KdpBindingType);
        setBleed(s.bleed as KdpBleedOption);
        setFontSize(s.font_size);
        setLineSpacing(s.line_spacing);
        setMarginTop(s.margin_top);
        setMarginBottom(s.margin_bottom);
        setMarginInner(s.margin_inner);
        setMarginOuter(s.margin_outer);
        setWordCount(s.word_count ?? "");
      }
    } catch {
      setError("Error cargando especificaciones");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(
        `/api/editorial/projects/${projectId}/workflow/book-specs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trim_size_id: trimSizeId,
            print_type: printType,
            paper_type: paperType,
            binding,
            bleed,
            font_size: fontSize,
            line_spacing: lineSpacing,
            margin_top: marginTop,
            margin_bottom: marginBottom,
            margin_inner: marginInner,
            margin_outer: marginOuter,
            word_count: wordCount || null,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setSpecs(json.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error ?? "Error guardando");
      }
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando especificaciones...
          </span>
        </CardContent>
      </Card>
    );
  }

  const selectedTrim = KDP_TRIM_SIZES.find((t) => t.id === trimSizeId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Especificaciones del Libro
            </CardTitle>
            <CardDescription>
              Configuracion Amazon KDP - formato, papel, tipografia y margenes
            </CardDescription>
          </div>
          {specs?.estimated_pages && (
            <Badge variant="outline" className="text-xs">
              ~{specs.estimated_pages} paginas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            Especificaciones guardadas correctamente
          </div>
        )}

        {/* Format Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" /> Formato
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tamano de corte</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={trimSizeId}
                onChange={(e) => setTrimSizeId(e.target.value)}
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Encuadernacion</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={binding}
                onChange={(e) => setBinding(e.target.value as KdpBindingType)}
              >
                {(Object.entries(KDP_BINDING_LABELS) as [KdpBindingType, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de papel</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as KdpPaperType)}
              >
                {KDP_PAPER_SPECS.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sangrado (Bleed)</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bleed}
                onChange={(e) => setBleed(e.target.value as KdpBleedOption)}
              >
                {(Object.entries(KDP_BLEED_LABELS) as [KdpBleedOption, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de impresion</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={printType}
                onChange={(e) => setPrintType(e.target.value)}
              >
                <option value="black_and_white">Blanco y negro</option>
                <option value="standard_color">Color estandar</option>
                <option value="premium_color">Color premium</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Conteo de palabras</Label>
              <Input
                type="number"
                value={wordCount}
                onChange={(e) =>
                  setWordCount(e.target.value ? parseInt(e.target.value) : "")
                }
                placeholder="Ej: 80000"
                className="text-sm"
              />
            </div>
          </div>

          {selectedTrim && (
            <p className="text-xs text-muted-foreground">
              Dimensiones: {selectedTrim.widthIn}&quot; x {selectedTrim.heightIn}&quot; ({selectedTrim.widthMm} x{" "}
              {selectedTrim.heightMm} mm)
            </p>
          )}
        </div>

        {/* Typography Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Tipografia</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tamano de fuente (pt)</Label>
              <Input
                type="number"
                step="0.5"
                min="8"
                max="16"
                value={fontSize}
                onChange={(e) => setFontSize(parseFloat(e.target.value) || 11)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interlineado</Label>
              <Input
                type="number"
                step="0.05"
                min="1.0"
                max="2.0"
                value={lineSpacing}
                onChange={(e) =>
                  setLineSpacing(parseFloat(e.target.value) || 1.15)
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Margins Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Margenes (pulgadas)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Superior</Label>
              <Input
                type="number"
                step="0.125"
                min="0.25"
                value={marginTop}
                onChange={(e) =>
                  setMarginTop(parseFloat(e.target.value) || 0.75)
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Inferior</Label>
              <Input
                type="number"
                step="0.125"
                min="0.25"
                value={marginBottom}
                onChange={(e) =>
                  setMarginBottom(parseFloat(e.target.value) || 0.75)
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interior (gutter)</Label>
              <Input
                type="number"
                step="0.125"
                min="0.375"
                value={marginInner}
                onChange={(e) =>
                  setMarginInner(parseFloat(e.target.value) || 0.875)
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exterior</Label>
              <Input
                type="number"
                step="0.125"
                min="0.25"
                value={marginOuter}
                onChange={(e) =>
                  setMarginOuter(parseFloat(e.target.value) || 0.5)
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Calculated info */}
        {specs?.estimated_pages && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium">Valores calculados</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Paginas estimadas: {specs.estimated_pages}</span>
              {specs.spine_width_in && (
                <span>
                  Lomo: {specs.spine_width_in}&quot; (
                  {(Number(specs.spine_width_in) * 25.4).toFixed(2)} mm)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar especificaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
