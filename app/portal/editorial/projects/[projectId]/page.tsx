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

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#1a3a6b]/30 border-t-cyan-400 animate-spin" />
        <p className="text-sm text-white/30">{t.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/portal/editorial/projects"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToBooks}
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-300">
            {error ?? "Proyecto no encontrado"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-white/10 text-white/60 hover:bg-white/5"
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
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToBooks}
        </Link>
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Project header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-[#1a3a6b]/30 to-[#1a3a6b]/50 border border-[#1a3a6b]/20 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-cyan-400/60" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="text-sm text-white/40 mt-0.5">{project.subtitle}</p>
            )}
            {project.author_name && (
              <p className="text-xs text-white/30 mt-0.5">
                {t.by} {project.author_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white/60">{t.progress}</span>
          <span className="text-2xl font-bold text-cyan-400">{visibleProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-cyan-400 transition-all duration-1000"
            style={{ width: `${visibleProgress}%` }}
          />
        </div>
        {project.due_date && (
          <p className="text-xs text-white/20 mt-3">
            {t.estimatedDelivery}: <span className="text-white/40">{formatDate(project.due_date, locale === "es" ? "es-ES" : "en-US")}</span>
          </p>
        )}
      </div>

      {/* Pipeline stages with delays */}
      <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-[#1a3a6b]/10">
          <h2 className="text-sm font-semibold text-white">{t.pipelineStatus}</h2>
          <p className="text-xs text-white/30 mt-0.5">{t.pipelineDesc}</p>
        </div>
        <div className="divide-y divide-white/5">
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
                  stage.isActive ? "bg-cyan-500/5" : ""
                } ${!stage.isRevealed ? "opacity-30" : ""}`}
              >
                {/* Status indicator */}
                <div className="shrink-0 mt-0.5">
                  {stage.isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    </div>
                  ) : stage.isActive ? (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                      {stage.isRevealed ? (
                        <Clock className="w-3 h-3 text-white/20" />
                      ) : (
                        <Lock className="w-3 h-3 text-white/10" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      stage.isCompleted ? "text-white/70" : stage.isActive ? "text-white" : "text-white/30"
                    }`}>
                      {stageLabel}
                    </span>
                    {stage.isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400">
                        {t.current}
                      </span>
                    )}
                  </div>
                  {stage.isRevealed && stageMsg && (
                    <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
                      {stageMsg}
                    </p>
                  )}
                </div>

                <span className="text-xs text-white/20 shrink-0 mt-0.5 tabular-nums">
                  {stage.isCompleted ? (
                    <span className="text-green-400/60">{t.stageCompleted}</span>
                  ) : stage.isActive ? (
                    <span className="text-cyan-400/60">{t.processing}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload new version */}
      <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/20 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-cyan-400/60" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">{t.uploadNewVersion}</p>
            <p className="text-xs text-white/30 mt-0.5">{t.uploadDesc}</p>
          </div>
        </div>

        {uploadError && (
          <p className="text-xs text-red-400 px-1 mb-2">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-xs text-green-400 px-1 mb-2 flex items-center gap-1">
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
          className="w-full h-11 bg-[#1a3a6b]/30 hover:bg-[#1a3a6b]/50 text-white border border-[#1a3a6b]/20 rounded-xl"
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
        <p className="text-xs text-white/15 text-center mt-2">{t.acceptedFormats}</p>
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-[#1a3a6b]/10">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/30" />
              {t.myFiles} ({files.length})
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/70 truncate capitalize">
                    {file.file_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-white/20">
                    v{file.version} · {formatBytes(file.size_bytes)} · {formatDate(file.created_at, locale === "es" ? "es-ES" : "en-US")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments — bidirectional */}
      <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-[#1a3a6b]/10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white/30" />
            {t.comments} ({comments.length})
          </h2>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-white/20">{t.editorialNotes}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {comments.map((c) => {
                const isClient = c.author_type === "client";
                return (
                  <div key={c.id} className={`px-4 py-3 ${isClient ? "bg-cyan-500/[0.03]" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${isClient ? "text-cyan-400/70" : "text-[#1a3a6b] dark:text-blue-300/70"}`}>
                        {isClient ? t.you : t.editorialTeam}
                      </span>
                      <span className="text-[10px] text-white/15">
                        {formatDate(c.created_at, locale === "es" ? "es-ES" : "en-US")}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{c.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="p-3 border-t border-[#1a3a6b]/10">
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
              className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30"
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

      {/* Downloads */}
      {projectExports.length > 0 && (
        <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-[#1a3a6b]/10">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-white/30" />
              {t.downloads} ({projectExports.length})
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {projectExports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white/70 uppercase">{exp.export_type}</p>
                  <p className="text-xs text-white/20">
                    v{exp.version} · {formatDate(exp.created_at, locale === "es" ? "es-ES" : "en-US")}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/10 text-green-400/80 text-xs font-medium">
                  {t.ready}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-white/10 text-center pb-4">
        &copy; {new Date().getFullYear()} Reino Editorial
      </p>
    </div>
  );
}
