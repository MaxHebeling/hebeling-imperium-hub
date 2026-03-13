"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Paintbrush, Image as ImageIcon, RefreshCw, Download } from "lucide-react";

interface CoverConcept {
  theme?: string;
  mood?: string;
  colors?: string;
  elements?: string;
  style?: string;
  cover_prompt?: string;
}

interface CoverResult {
  fileId: string | null;
  storagePath: string;
  publicUrl: string | null;
  version: number;
  concept: CoverConcept;
  revisedPrompt: string;
}

interface ExistingCover {
  id: string;
  version: number;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
  publicUrl: string | null;
}

export function CoverGeneratorPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingCovers, setExistingCovers] = useState<ExistingCover[]>([]);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [hasLoadedCovers, setHasLoadedCovers] = useState(false);

  async function loadExistingCovers() {
    setLoadingCovers(true);
    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/generate-cover`
      );
      const json = await res.json();
      if (res.ok && json?.success) {
        setExistingCovers(json.covers ?? []);
      }
    } catch {
      // Silently fail - covers section is supplementary
    } finally {
      setLoadingCovers(false);
      setHasLoadedCovers(true);
    }
  }

  // Load covers on first render
  if (!hasLoadedCovers && !loadingCovers) {
    void loadExistingCovers();
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/generate-cover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userPrompt: userPrompt.trim() || undefined }),
        }
      );
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error ?? `Error HTTP ${res.status}`);
        return;
      }

      setResult(json.cover as CoverResult);
      router.refresh();
      void loadExistingCovers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paintbrush className="h-4 w-4 text-purple-500" />
            Generador de Portadas AI
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            La AI lee el manuscrito, analiza su contenido y genera una portada profesional con DALL-E 3.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cover-prompt" className="text-sm font-medium">
              Indicaciones adicionales (opcional)
            </label>
            <Textarea
              id="cover-prompt"
              placeholder="Ej: Quiero colores cálidos, estilo minimalista, una silueta de persona mirando al horizonte..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              disabled={isGenerating}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              La AI combinará el análisis del manuscrito con tus indicaciones para generar la portada.
              Si lo dejas vacío, la AI decidirá el diseño basándose 100% en el contenido.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando portada...
              </>
            ) : (
              <>
                <Paintbrush className="h-4 w-4" />
                Generar Portada con AI
              </>
            )}
          </Button>

          {isGenerating && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Analizando manuscrito y generando portada... esto puede tardar 30-60 segundos.
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Generated Result */}
          {result && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">Generada</Badge>
                <span className="text-sm text-muted-foreground">Versión {result.version}</span>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                {/* Cover Image */}
                {result.publicUrl && (
                  <div className="shrink-0">
                    <img
                      src={result.publicUrl}
                      alt={`Portada generada v${result.version}`}
                      className="h-auto w-full max-w-xs rounded-lg border border-border shadow-md md:w-48"
                    />
                  </div>
                )}

                {/* Concept Details */}
                <div className="space-y-2 text-sm">
                  {result.concept.theme && (
                    <p>
                      <span className="font-medium">Tema:</span>{" "}
                      <span className="text-muted-foreground">{result.concept.theme}</span>
                    </p>
                  )}
                  {result.concept.mood && (
                    <p>
                      <span className="font-medium">Tono visual:</span>{" "}
                      <span className="text-muted-foreground">{result.concept.mood}</span>
                    </p>
                  )}
                  {result.concept.colors && (
                    <p>
                      <span className="font-medium">Paleta:</span>{" "}
                      <span className="text-muted-foreground">{result.concept.colors}</span>
                    </p>
                  )}
                  {result.concept.elements && (
                    <p>
                      <span className="font-medium">Elementos:</span>{" "}
                      <span className="text-muted-foreground">{result.concept.elements}</span>
                    </p>
                  )}
                  {result.concept.style && (
                    <p>
                      <span className="font-medium">Estilo:</span>{" "}
                      <span className="text-muted-foreground">{result.concept.style}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerar
                </Button>
                {result.publicUrl && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={result.publicUrl} download={`portada-v${result.version}.png`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3" />
                      Descargar
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Covers Gallery */}
      {existingCovers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              Portadas Generadas
              <Badge variant="secondary" className="ml-1">
                {existingCovers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {existingCovers.map((cover) => (
                <div key={cover.id} className="group relative">
                  {cover.publicUrl ? (
                    <img
                      src={cover.publicUrl}
                      alt={`Portada v${cover.version}`}
                      className="h-auto w-full rounded-lg border border-border shadow-sm transition-shadow group-hover:shadow-md"
                    />
                  ) : (
                    <div className="flex aspect-[9/16] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">v{cover.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(cover.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {cover.publicUrl && (
                    <a
                      href={cover.publicUrl}
                      download={`portada-v${cover.version}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-end justify-center rounded-lg bg-black/0 pb-8 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100"
                    >
                      <Button variant="secondary" size="sm" className="gap-1.5 shadow-md">
                        <Download className="h-3 w-3" />
                        Descargar
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
