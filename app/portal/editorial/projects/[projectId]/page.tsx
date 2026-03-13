"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
  Download,
  MessageSquare,
  Send,
  Globe,
  Lock,
  Palette,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialComment,
  EditorialExport,
  EditorialStageKey,
} from "@/lib/editorial/types/editorial";
import { EDITORIAL_STAGE_KEYS } from "@/lib/editorial/pipeline/constants";
import {
  getClientVisibleStages,
  getClientVisibleProgress,
} from "@/lib/editorial/pipeline/client-delays";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProgressData {
  project: Pick<
    EditorialProject,
    | "id"
    | "title"
    | "subtitle"
    | "author_name"
    | "language"
    | "genre"
    | "current_stage"
    | "status"
    | "progress_percent"
    | "due_date"
    | "created_at"
  >;
  stages: EditorialStage[];
  files: EditorialFile[];
  comments: EditorialComment[];
  exports: EditorialExport[];
}

function formatDate(d: string | null, locale: string = "es-ES") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [locale, setLocale] = useState<PortalLocale>("es");

  // Cover request state
  const [showCoverForm, setShowCoverForm] = useState(false);
  const [coverAuthorPrompt, setCoverAuthorPrompt] = useState("");
  const [coverColorPalette, setCoverColorPalette] = useState("");
  const [coverReferences, setCoverReferences] = useState("");
  const [coverImageStyle, setCoverImageStyle] = useState<"realistic" | "illustrated" | "abstract" | "typographic" | "photographic">("illustrated");
  const [sendingCoverRequest, setSendingCoverRequest] = useState(false);
  const [coverRequestSuccess, setCoverRequestSuccess] = useState(false);
  const [coverRequestError, setCoverRequestError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = getTranslations(locale);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  const toggleLocale = () => {
    const next = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("reino-locale", next);
  };

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/progress`
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error ?? "Error al cargar el proyecto");
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }, [projectId, t.networkError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/upload`,
        { method: "POST", body: formData }
      );
      const json = await res.json();

      if (json.success) {
        setUploadSuccess(true);
        await fetchData();
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        setUploadError(json.error ?? "Error al subir el archivo");
      }
    } catch {
      setUploadError("Error de red al subir el archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSendComment() {
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: commentText.trim() }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setCommentText("");
        await fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setSendingComment(false);
    }
  }

  async function handleCoverRequest() {
    if (!coverAuthorPrompt.trim() || sendingCoverRequest) return;
    setSendingCoverRequest(true);
    setCoverRequestError("");
    setCoverRequestSuccess(false);
    try {
      const res = await fetch(
        `/api/editorial/client/projects/${projectId}/cover-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorPrompt: coverAuthorPrompt.trim(),
            colorPalette: coverColorPalette.trim() || undefined,
            references: coverReferences.trim() || undefined,
            imageStyle: coverImageStyle,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setCoverRequestSuccess(true);
        setCoverAuthorPrompt("");
        setCoverColorPalette("");
        setCoverReferences("");
        setCoverImageStyle("illustrated");
        setTimeout(() => {
          setCoverRequestSuccess(false);
          setShowCoverForm(false);
        }, 5000);
      } else {
        setCoverRequestError(json.error ?? (locale === "es" ? "Error al enviar solicitud" : "Error sending request"));
      }
    } catch {
      setCoverRequestError(locale === "es" ? "Error de red" : "Network error");
    } finally {
      setSendingCoverRequest(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#1a3a6b]/20 border-t-[#1a3a6b] animate-spin" />
        <p className="text-sm text-gray-400">{t.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/portal/editorial/projects"
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToBooks}
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">
            {error ?? "Proyecto no encontrado"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            {t.retry}
          </Button>
        </div>
      </div>
    );
  }

  const { project, files, comments, exports: projectExports } = data;

  // Client-visible stages with delays
  const visibleStages = getClientVisibleStages(
    project.created_at,
    project.current_stage as EditorialStageKey
  );
  const visibleProgress = getClientVisibleProgress(
    project.created_at,
    project.current_stage as EditorialStageKey
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/editorial/projects"
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToBooks}
        </Link>
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Project header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-[#1a3a6b]/10 to-[#1a3a6b]/20 border border-[#1a3a6b]/10 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-[#1a3a6b]/60" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="text-sm text-gray-400 mt-0.5">{project.subtitle}</p>
            )}
            {project.author_name && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t.by} {project.author_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">{t.progress}</span>
          <span className="text-2xl font-bold text-[#1a3a6b]">{visibleProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] transition-all duration-1000"
            style={{ width: `${visibleProgress}%` }}
          />
        </div>
        {project.due_date && (
          <p className="text-xs text-gray-400 mt-3">
            {t.estimatedDelivery}: <span className="text-gray-600">{formatDate(project.due_date, locale === "es" ? "es-ES" : "en-US")}</span>
          </p>
        )}
      </div>

      {/* Pipeline stages with delays */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{t.pipelineStatus}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.pipelineDesc}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {visibleStages.map((stage, index) => {
            const stageLabel = t.stageLabels[stage.stageKey] ?? stage.label;
            const stageMsg = stage.isCompleted
              ? t.stageMessages[stage.stageKey]?.completed ?? stage.message
              : stage.isActive
                ? t.stageMessages[stage.stageKey]?.active ?? stage.message
                : "";

            return (
              <div
                key={stage.stageKey}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                  stage.isActive ? "bg-blue-50" : ""
                } ${!stage.isRevealed ? "opacity-30" : ""}`}
              >
                {/* Status indicator */}
                <div className="shrink-0 mt-0.5">
                  {stage.isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  ) : stage.isActive ? (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#1a3a6b] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      {stage.isRevealed ? (
                        <Clock className="w-3 h-3 text-gray-300" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-200" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      stage.isCompleted ? "text-gray-600" : stage.isActive ? "text-gray-900" : "text-gray-300"
                    }`}>
                      {stageLabel}
                    </span>
                    {stage.isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1a3a6b]/10 text-[#1a3a6b]">
                        {t.current}
                      </span>
                    )}
                  </div>
                  {stage.isRevealed && stageMsg && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {stageMsg}
                    </p>
                  )}
                </div>

                <span className="text-xs text-gray-300 shrink-0 mt-0.5 tabular-nums">
                  {stage.isCompleted ? (
                    <span className="text-green-500">{t.stageCompleted}</span>
                  ) : stage.isActive ? (
                    <span className="text-[#1a3a6b]">{t.processing}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload new version */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-[#1a3a6b]/60" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{t.uploadNewVersion}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.uploadDesc}</p>
          </div>
        </div>

        {uploadError && (
          <p className="text-xs text-red-500 px-1 mb-2">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-xs text-green-500 px-1 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.uploadSuccess}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".doc,.docx,.pdf,.txt,.odt"
          onChange={handleUpload}
          disabled={uploading}
        />
        <Button
          className="w-full h-11 bg-[#1a3a6b] hover:bg-[#2a5a9b] text-white border border-[#1a3a6b]/20 rounded-xl"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.uploading}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {t.selectFile}
            </>
          )}
        </Button>
        <p className="text-xs text-gray-300 text-center mt-2">{t.acceptedFormats}</p>
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              {t.myFiles} ({files.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate capitalize">
                    {file.file_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-400">
                    v{file.version} · {formatBytes(file.size_bytes)} · {formatDate(file.created_at, locale === "es" ? "es-ES" : "en-US")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments — bidirectional */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            {t.comments} ({comments.length})
          </h2>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-gray-400">{t.editorialNotes}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {comments.map((c) => {
                const isClient = c.author_type === "client";
                return (
                  <div key={c.id} className={`px-4 py-3 ${isClient ? "bg-blue-50/50" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${isClient ? "text-[#1a3a6b]" : "text-gray-500"}`}>
                        {isClient ? t.you : t.editorialTeam}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {formatDate(c.created_at, locale === "es" ? "es-ES" : "en-US")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              placeholder={t.writeComment}
              className="flex-1 h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#1a3a6b]/30"
            />
            <Button
              size="sm"
              onClick={handleSendComment}
              disabled={!commentText.trim() || sendingComment}
              className="h-10 px-3 rounded-xl bg-[#1a3a6b] hover:bg-[#2a5a9b] text-white"
            >
              {sendingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Request — Author can suggest their vision */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" />
              {locale === "es" ? "Diseño de Portada" : "Cover Design"}
            </h2>
            <button
              onClick={() => setShowCoverForm(!showCoverForm)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-100"
            >
              {showCoverForm
                ? (locale === "es" ? "Cerrar" : "Close")
                : (locale === "es" ? "Sugerir Portada" : "Suggest Cover")}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {locale === "es"
              ? "Comparte tu visión para la portada de tu libro. Nuestro equipo editorial también generará propuestas."
              : "Share your vision for your book cover. Our editorial team will also generate proposals."}
          </p>
        </div>

        {coverRequestSuccess && (
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-700">
              {locale === "es"
                ? "¡Solicitud enviada! Nuestro equipo revisará tu visión y generará opciones de portada."
                : "Request sent! Our team will review your vision and generate cover options."}
            </p>
          </div>
        )}

        {showCoverForm && !coverRequestSuccess && (
          <div className="p-4 space-y-4">
            {/* Author vision */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {locale === "es" ? "Tu visión para la portada *" : "Your cover vision *"}
              </label>
              <textarea
                value={coverAuthorPrompt}
                onChange={(e) => setCoverAuthorPrompt(e.target.value)}
                placeholder={locale === "es"
                  ? "Describe cómo imaginas la portada de tu libro. Ej: Un atardecer sobre montañas con tonos cálidos, el título en letras elegantes doradas..."
                  : "Describe how you imagine your book cover. E.g.: A sunset over mountains with warm tones, the title in elegant golden letters..."}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-purple-300 resize-none"
              />
            </div>

            {/* Image style */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {locale === "es" ? "Estilo visual" : "Visual style"}
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {([
                  { value: "realistic" as const, label: locale === "es" ? "Realista" : "Realistic", icon: "📷" },
                  { value: "illustrated" as const, label: locale === "es" ? "Ilustrado" : "Illustrated", icon: "🎨" },
                  { value: "abstract" as const, label: locale === "es" ? "Abstracto" : "Abstract", icon: "🔮" },
                  { value: "typographic" as const, label: locale === "es" ? "Tipográfico" : "Typographic", icon: "✍️" },
                  { value: "photographic" as const, label: locale === "es" ? "Fotográfico" : "Photographic", icon: "📸" },
                ]).map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setCoverImageStyle(style.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all ${
                      coverImageStyle === style.value
                        ? "border-purple-300 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <span className="font-medium">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color palette */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {locale === "es" ? "Paleta de colores (opcional)" : "Color palette (optional)"}
              </label>
              <input
                type="text"
                value={coverColorPalette}
                onChange={(e) => setCoverColorPalette(e.target.value)}
                placeholder={locale === "es"
                  ? "Ej: Azul oscuro, dorado, blanco"
                  : "E.g.: Dark blue, gold, white"}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-purple-300"
              />
            </div>

            {/* References */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {locale === "es" ? "Referencias o inspiración (opcional)" : "References or inspiration (optional)"}
              </label>
              <input
                type="text"
                value={coverReferences}
                onChange={(e) => setCoverReferences(e.target.value)}
                placeholder={locale === "es"
                  ? "Ej: Estilo similar a 'El Alquimista', portadas minimalistas de Penguin..."
                  : "E.g.: Style similar to 'The Alchemist', Penguin minimalist covers..."}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-purple-300"
              />
            </div>

            {coverRequestError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {coverRequestError}
              </p>
            )}

            {/* Submit */}
            <Button
              onClick={handleCoverRequest}
              disabled={!coverAuthorPrompt.trim() || sendingCoverRequest}
              className="w-full h-11 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}
            >
              {sendingCoverRequest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {locale === "es" ? "Enviando..." : "Sending..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {locale === "es" ? "Enviar mi visión de portada" : "Send my cover vision"}
                </>
              )}
            </Button>

            <p className="text-[11px] text-gray-300 text-center">
              {locale === "es"
                ? "Nuestro equipo editorial usará tu visión junto con IA para generar opciones de portada profesionales."
                : "Our editorial team will use your vision along with AI to generate professional cover options."}
            </p>
          </div>
        )}
      </div>

      {/* Downloads */}
      {projectExports.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-400" />
              {t.downloads} ({projectExports.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {projectExports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase">{exp.export_type}</p>
                  <p className="text-xs text-gray-400">
                    v{exp.version} · {formatDate(exp.created_at, locale === "es" ? "es-ES" : "en-US")}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-600 text-xs font-medium">
                  {t.ready}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-300 text-center pb-4">
        &copy; {new Date().getFullYear()} Reino Editorial
      </p>
    </div>
  );
}
