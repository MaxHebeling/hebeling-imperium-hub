"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { EditorialProject } from "@/lib/editorial/types/editorial";
import { getClientVisibleProgress } from "@/lib/editorial/pipeline/client-delays";
import { resolvePipelineStageKey } from "@/lib/editorial/pipeline/stage-compat";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";

export default function PortalOverviewPage() {
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<PortalLocale>("es");

  const t = getTranslations(locale);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

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

  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && p.status !== "archived"
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const inReviewProjects = projects.filter(
    (p) => resolvePipelineStageKey(p.current_stage) === "revision_final" || p.status === "review"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {locale === "es" ? "Resumen" : "Overview"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {locale === "es"
            ? "Estado general de tus proyectos editoriales."
            : "General status of your editorial projects."}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#1a3a6b]/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#1a3a6b]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? "\u2014" : activeProjects.length}
                </p>
                <p className="text-sm text-gray-500">
                  {locale === "es" ? "Libros Activos" : "Active Books"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? "\u2014" : inReviewProjects.length}
                </p>
                <p className="text-sm text-gray-500">
                  {locale === "es" ? "En Revisi\u00f3n" : "In Review"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? "\u2014" : completedProjects.length}
                </p>
                <p className="text-sm text-gray-500">
                  {locale === "es" ? "Completados" : "Completed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload CTA */}
      <Card className="bg-gradient-to-br from-[#1a3a6b]/5 to-[#1a3a6b]/10 border-[#1a3a6b]/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-[#1a3a6b]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {locale === "es" ? "Subir Documentos" : "Upload Documents"}
                </h3>
                <p className="text-sm text-gray-500">
                  {locale === "es"
                    ? "Comparte archivos o material con tu equipo editorial"
                    : "Share files or assets with your editorial team"}
                </p>
              </div>
            </div>
            <Button className="shrink-0 bg-[#1a3a6b] hover:bg-[#1a3a6b]/90">
              <Upload className="h-4 w-4 mr-2" />
              {locale === "es" ? "Subir Archivos" : "Upload Files"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Status */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {locale === "es" ? "Estado de tus Libros" : "Book Status"}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {locale === "es"
                  ? "Progreso editorial de cada proyecto"
                  : "Editorial progress for each project"}
              </CardDescription>
            </div>
            <Link href="/portal/editorial/projects">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                {locale === "es" ? "Ver Todos" : "View All"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-[#1a3a6b] animate-spin" />
              <p className="text-sm text-gray-400">{t.loading}</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#1a3a6b]/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-[#1a3a6b]/40" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">{t.noProjectsYet}</p>
                <p className="text-sm text-gray-400 mt-1">{t.noProjectsDesc}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const pipelineStageKey = resolvePipelineStageKey(project.current_stage);
                const visibleProgress = getClientVisibleProgress(
                  project.created_at,
                  project.current_stage
                );
                const stageLabel =
                  t.stageLabels[pipelineStageKey] ??
                  project.current_stage;

                return (
                  <Link
                    key={project.id}
                    href={`/portal/editorial/projects/${project.id}`}
                    className="block group"
                  >
                    <div className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg bg-gradient-to-b from-[#1a3a6b]/10 to-[#1a3a6b]/20 border border-[#1a3a6b]/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-[#1a3a6b]/60" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900">
                              {project.title}
                            </h4>
                            {project.author_name && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {project.author_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs font-medium">
                            {stageLabel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1a3a6b] transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {locale === "es" ? "Progreso" : "Progress"}
                          </span>
                          <span className="font-medium text-[#1a3a6b]/70">
                            {visibleProgress}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] transition-all duration-700"
                            style={{ width: `${visibleProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
