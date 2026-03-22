"use client";

import { useState, useCallback } from "react";
import {
  Palette,
  Zap,
  User,
  Loader2,
  Download,
  RefreshCw,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type ImageStyle = "realistic" | "illustrated" | "abstract" | "typographic" | "photographic";

interface CoverResult {
  imageUrl: string;
  revisedPrompt: string;
  mode: "editorial" | "author";
  generatedAt: string;
}

const IMAGE_STYLES: { value: ImageStyle; label: string; desc: string }[] = [
  { value: "realistic", label: "Fotorrealista", desc: "Fotografía profesional" },
  { value: "illustrated", label: "Ilustrado", desc: "Arte digital de alta calidad" },
  { value: "abstract", label: "Abstracto", desc: "Arte moderno y elegante" },
  { value: "typographic", label: "Tipográfico", desc: "Diseño minimalista con letras" },
  { value: "photographic", label: "Fotográfico", desc: "Fotografía artística" },
];

const VISUAL_TONES = [
  "Oscuro y misterioso",
  "Claro y esperanzador",
  "Cálido y acogedor",
  "Frío y dramático",
  "Minimalista y limpio",
  "Vibrante y colorido",
  "Elegante y sofisticado",
  "Rústico y natural",
];

export default function PortadasAIPage() {
  const [mode, setMode] = useState<"editorial" | "author">("editorial");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("illustrated");
  const [visualTone, setVisualTone] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [references, setReferences] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authorPrompt, setAuthorPrompt] = useState("");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [covers, setCovers] = useState<CoverResult[]>([]);
  const [selectedCover, setSelectedCover] = useState<CoverResult | null>(null);

  // Projects list for selector
  const [projects, setProjects] = useState<Array<{ id: string; title: string; author_name: string | null; genre: string | null; target_audience: string | null }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/editorial/projects?limit=50");
      const json = await res.json();
      if (json.success && json.projects) {
        setProjects(json.projects);
      }
    } catch {
      // silent
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Load projects on first focus
  const handleProjectFocus = () => {
    if (projects.length === 0 && !loadingProjects) {
      fetchProjects();
    }
  };

  const handleProjectSelect = (id: string) => {
    setProjectId(id);
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      setTitle(proj.title || "");
      setAuthorName(proj.author_name || "");
      setGenre(proj.genre || "");
      setTargetAudience(proj.target_audience || "");
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !authorName.trim()) {
      setError("El título del libro y el nombre del autor son obligatorios.");
      return;
    }
    if (mode === "author" && !authorPrompt.trim()) {
      setError("Describe tu visión para la portada.");
      return;
    }

    setError("");
    setGenerating(true);

    try {
      const endpoint = projectId
        ? `/api/staff/projects/${projectId}/generate-cover`
        : "/api/editorial/ai/generate-cover";

      const body: Record<string, unknown> = {
        mode,
        title,
        authorName,
        genre,
        synopsis,
        targetAudience,
        imageStyle,
        visualTone,
        colorPalette,
        references,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        authorPrompt,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success && json.cover) {
        const newCover = json.cover as CoverResult;
        setCovers((prev) => [newCover, ...prev]);
        setSelectedCover(newCover);
      } else {
        setError(json.error || "Error al generar la portada.");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b] transition-all";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Back nav */}
      <Link
        href="/app/editorial"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Editorial
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portadas Premium</h1>
          <p className="text-sm text-gray-500">HEBELING AI prepara conceptos visuales y prompts listos para tu workflow de portada</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Mode selector */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode("editorial")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "editorial"
                  ? "bg-[#1a3a6b] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap className="w-4 h-4" />
              Sugerencia Editorial
            </button>
            <button
              onClick={() => setMode("author")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "author"
                  ? "bg-[#1a3a6b] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4" />
              Visión del Autor
            </button>
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            {mode === "editorial"
              ? "HEBELING AI construye el concepto visual editorial a partir del manuscrito, género y lector objetivo."
              : "El autor comparte su visión y HEBELING AI la convierte en una dirección visual clara para portada."}
          </p>

          {/* Project selector (optional) */}
          <div>
            <label className={labelCls}>Proyecto editorial (opcional)</label>
            <select
              value={projectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              onFocus={handleProjectFocus}
              className={inputCls}
            >
              <option value="">Ingresar datos manualmente</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.author_name || "Sin autor"}
                </option>
              ))}
            </select>
          </div>

          {/* Book info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Título del libro <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: El Camino del Rey"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Nombre del autor <span className="text-red-400">*</span>
              </label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej: María García"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Género</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className={inputCls}>
                <option value="">Seleccionar</option>
                <option value="Ficción">Ficción</option>
                <option value="No ficción">No ficción</option>
                <option value="Autoayuda">Autoayuda</option>
                <option value="Espiritualidad">Espiritualidad</option>
                <option value="Negocios">Negocios</option>
                <option value="Infantil">Infantil</option>
                <option value="Poesía">Poesía</option>
                <option value="Biografía">Biografía</option>
                <option value="Ciencia">Ciencia</option>
                <option value="Historia">Historia</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Público objetivo</label>
              <input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ej: Adultos jóvenes"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Sinopsis breve</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Describe brevemente de qué trata el libro..."
              className={`${inputCls} min-h-[80px] resize-none`}
            />
          </div>

          {/* Author prompt (only in author mode) */}
          {mode === "author" && (
            <div>
              <label className={labelCls}>
                Visión del autor para la portada <span className="text-red-400">*</span>
              </label>
              <textarea
                value={authorPrompt}
                onChange={(e) => setAuthorPrompt(e.target.value)}
                placeholder="Describe cómo imaginas la portada de tu libro. Incluye colores, elementos, estilo..."
                className={`${inputCls} min-h-[100px] resize-none`}
              />
            </div>
          )}

          {/* Style options */}
          <div>
            <label className={labelCls}>Estilo de imagen</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {IMAGE_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setImageStyle(s.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    imageStyle === s.value
                      ? "border-[#1a3a6b] bg-[#1a3a6b]/5 ring-1 ring-[#1a3a6b]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-xs font-semibold ${imageStyle === s.value ? "text-[#1a3a6b]" : "text-gray-700"}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Visual tone */}
          <div>
            <label className={labelCls}>Tono visual</label>
            <div className="flex flex-wrap gap-2">
              {VISUAL_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setVisualTone(visualTone === tone ? "" : tone)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    visualTone === tone
                      ? "border-[#1a3a6b] bg-[#1a3a6b]/10 text-[#1a3a6b]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced options */}
          <details className="group">
            <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              Opciones avanzadas
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className={labelCls}>Paleta de colores</label>
                <input
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value)}
                  placeholder="Ej: Azul oscuro, dorado, blanco"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Referencias visuales</label>
                <input
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                  placeholder="Libros o estilos que te gustaría emular"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Palabras clave (separadas por coma)</label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Ej: fe, esperanza, camino, luz"
                  className={inputCls}
                />
              </div>
            </div>
          </details>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Construyendo concepto visual...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generar Concepto de Portada
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            HEBELING AI te devuelve una propuesta visual y un prompt refinado para continuar el diseño final dentro de tu workflow.
          </p>
        </div>

        {/* Right: Preview + Gallery */}
        <div className="space-y-6">
          {/* Main preview */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Vista Previa</h3>
              {selectedCover && (
                <a
                  href={selectedCover.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2a5a9b] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Descargar HD
                </a>
              )}
            </div>
            <div className="p-6 flex items-center justify-center min-h-[500px] bg-gray-50">
              {generating ? (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#1a3a6b] mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Preparando dirección visual...</p>
                  <p className="text-xs text-gray-400 mt-1">Esto puede tardar 15-30 segundos</p>
                </div>
              ) : selectedCover ? (
                <div className="relative w-full max-w-sm">
                  <img
                    src={selectedCover.imageUrl}
                    alt="Portada generada"
                    className="w-full rounded-lg shadow-xl"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      selectedCover.mode === "editorial"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedCover.mode === "editorial" ? "Sugerencia Editorial" : "Visión del Autor"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Genera tu primera portada</p>
                  <p className="text-xs text-gray-300 mt-1">La portada aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>

          {/* Gallery of generated covers */}
          {covers.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Portadas generadas ({covers.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {covers.map((c, i) => (
                  <button
                    key={c.generatedAt + i}
                    onClick={() => setSelectedCover(c)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCover?.generatedAt === c.generatedAt
                        ? "border-[#1a3a6b] ring-2 ring-[#1a3a6b]/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={c.imageUrl}
                      alt={`Portada ${i + 1}`}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute bottom-1 left-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        c.mode === "editorial"
                          ? "bg-purple-100/90 text-purple-700"
                          : "bg-blue-100/90 text-blue-700"
                      }`}>
                        {c.mode === "editorial" ? "Editorial" : "Autor"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Revised prompt info */}
          {selectedCover && (
            <details className="group">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Ver prompt maestro para Midjourney / dirección visual
              </summary>
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg leading-relaxed">
                {selectedCover.revisedPrompt}
              </p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
