"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  ChevronRight,
  AlertCircle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WebProject } from "@/lib/ikingdom/types/web-project";
import type { WebStageKey } from "@/lib/ikingdom/types/web-project";
import { WEB_STAGE_LABELS, WEB_SERVICE_TYPE_LABELS } from "@/lib/ikingdom/pipeline/constants";

export default function ClientWebProjectsPage() {
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ikingdom/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects);
      } else {
        setError(json.error ?? "Error al cargar tus proyectos");
      }
    } catch {
      setError("Error de conexi\u00f3n. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Mis Proyectos Web
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Revisa el progreso de tus proyectos de desarrollo web.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#00d4aa]/20 border-t-[#00d4aa] animate-spin" />
          <p className="text-sm text-gray-400">Cargando proyectos...</p>
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
            Reintentar
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-4 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#00d4aa]/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-[#00d4aa]/40" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">No tienes proyectos web a\u00fan</p>
            <p className="text-sm text-gray-400 mt-1">
              Cuando tu proyecto est\u00e9 activo, aparecer\u00e1 aqu\u00ed.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => {
            const stageLabel = WEB_STAGE_LABELS[project.current_stage as WebStageKey] ?? project.current_stage;

            return (
              <Link
                key={project.id}
                href={`/portal/ikingdom/projects/${project.id}`}
                className="block group"
              >
                <div className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 p-4 transition-all active:scale-[0.99] shadow-sm">
                  <div className="flex items-start gap-4">
                    {/* Web icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#00d4aa]/10 to-[#3b82f6]/10 border border-[#00d4aa]/10 flex items-center justify-center shrink-0">
                      <Code2 className="w-5 h-5 text-[#00d4aa]/60" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 leading-snug truncate">
                            {project.title}
                          </p>
                          {project.domain && (
                            <p className="text-xs text-[#00d4aa] truncate mt-0.5 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {project.domain}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00d4aa] shrink-0 mt-0.5 transition-colors" />
                      </div>

                      {/* Stage & service badges */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#00d4aa]/10 text-[#00d4aa] text-xs font-medium">
                          {stageLabel}
                        </span>
                        {project.service_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                            {WEB_SERVICE_TYPE_LABELS[project.service_type] ?? project.service_type}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] to-[#3b82f6] transition-all duration-700"
                            style={{ width: `${project.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#00d4aa]/70 w-8 text-right shrink-0">
                          {project.progress_percent}%
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
          \u00bfNo ves tu proyecto?{" "}
          <a
            href="mailto:info@ikingdom.org"
            className="text-[#00d4aa]/60 hover:text-[#00d4aa] transition-colors"
          >
            Cont\u00e1ctanos
          </a>
        </p>
      )}
    </div>
  );
}
