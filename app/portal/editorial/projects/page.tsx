"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EditorialProject } from "@/lib/editorial/types/editorial";
import { getClientVisibleProgress } from "@/lib/editorial/pipeline/client-delays";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

export default function ClientEditorialProjectsPage() {
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<PortalLocale>("es");

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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/editorial/client/projects/list");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      } else {
        setError(json.error ?? "Error al cargar tus proyectos");
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }, [t.networkError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t.myBooksTitle}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t.myBooksSubtitle}
          </p>
        </div>
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#1a3a6b]/20 border-t-[#1a3a6b] animate-spin" />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            className="border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            {t.retry}
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-4 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#1a3a6b]/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#1a3a6b]/40" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">{t.noProjectsYet}</p>
            <p className="text-sm text-gray-400 mt-1">
              {t.noProjectsDesc}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => {
            const visibleProgress = getClientVisibleProgress(
              project.created_at,
              project.current_stage as EditorialStageKey
            );
            const stageLabel = t.stageLabels[project.current_stage as EditorialStageKey] ?? project.current_stage;

            return (
              <Link
                key={project.id}
                href={`/portal/editorial/projects/${project.id}`}
                className="block group"
              >
                <div className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 p-4 transition-all active:scale-[0.99] shadow-sm">
                  <div className="flex items-start gap-4">
                    {/* Book avatar */}
                    <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-[#1a3a6b]/10 to-[#1a3a6b]/20 border border-[#1a3a6b]/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-[#1a3a6b]/60" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 leading-snug truncate">
                            {project.title}
                          </p>
                          {project.author_name && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {project.author_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1a3a6b] shrink-0 mt-0.5 transition-colors" />
                      </div>

                      {/* Stage badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs font-medium">
                          {stageLabel}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] transition-all duration-700"
                            style={{ width: `${visibleProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#1a3a6b]/70 w-8 text-right shrink-0">
                          {visibleProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info note */}
      {!loading && !error && projects.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {t.cantSeeBook}{" "}
          <a
            href="mailto:editorial@reinoeditorial.com"
            className="text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors"
          >
            {t.contactUs}
          </a>
        </p>
      )}
    </div>
  );
}
