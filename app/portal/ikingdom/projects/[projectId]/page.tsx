"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Palette,
  FileText,
  TestTube2,
  Rocket,
  Headphones,
  ClipboardList,
  PenTool,
} from "lucide-react";
import type { WebStageKey, WebStageStatus } from "@/lib/ikingdom/types/web-project";
import {
  WEB_STAGE_KEYS,
  WEB_STAGE_LABELS,
  WEB_STAGE_DESCRIPTIONS,
  WEB_SERVICE_TYPE_LABELS,
} from "@/lib/ikingdom/pipeline/constants";

const STAGE_ICONS: Record<WebStageKey, React.ElementType> = {
  briefing: ClipboardList,
  diseno: Palette,
  desarrollo: Code2,
  contenido: PenTool,
  revision: FileText,
  testing: TestTube2,
  lanzamiento: Rocket,
  soporte: Headphones,
};

function getStageStatusStyle(status: WebStageStatus) {
  switch (status) {
    case "completed":
      return { color: "#00d4aa", bg: "#00d4aa10", label: "Completada" };
    case "processing":
      return { color: "#3b82f6", bg: "#3b82f610", label: "En Proceso" };
    case "review_required":
      return { color: "#f59e0b", bg: "#f59e0b10", label: "En Revisi\u00f3n" };
    case "failed":
      return { color: "#ef4444", bg: "#ef444410", label: "Error" };
    case "queued":
      return { color: "#8b5cf6", bg: "#8b5cf610", label: "En Cola" };
    default:
      return { color: "#9ca3af", bg: "#9ca3af10", label: "Pendiente" };
  }
}

interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  domain: string | null;
  service_type: string | null;
  current_stage: WebStageKey;
  status: string;
  progress_percent: number;
  tech_stack: string | null;
  due_date: string | null;
  created_at: string;
}

interface StageData {
  id: string;
  stage_key: WebStageKey;
  status: WebStageStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export default function ClientWebProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ikingdom/projects/${projectId}/progress`);
      const json = await res.json();
      if (json.success) {
        setProject(json.project);
        setStages(json.stages);
      }
    } catch {
      console.error("Error fetching project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium text-gray-600">Proyecto no encontrado</p>
        <Link href="/portal/ikingdom/projects" className="text-sm text-[#00d4aa] underline">
          Volver a mis proyectos
        </Link>
      </div>
    );
  }

  const stageMap = new Map(stages.map((s) => [s.stage_key, s]));

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/portal/ikingdom/projects"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis proyectos
      </Link>

      {/* Project header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00d4aa]/10 to-[#3b82f6]/10 border border-[#00d4aa]/10 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-[#00d4aa]/60" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              {project.domain && (
                <span className="text-sm text-[#00d4aa] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {project.domain}
                </span>
              )}
              {project.service_type && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                  {WEB_SERVICE_TYPE_LABELS[project.service_type] ?? project.service_type}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-gray-400 mt-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso General</span>
            <span className="text-sm font-bold text-[#00d4aa]">{project.progress_percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] to-[#3b82f6] transition-all duration-700"
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline stages */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Etapas del Proyecto</h2>
        <div className="space-y-2">
          {WEB_STAGE_KEYS.map((key, idx) => {
            const stage = stageMap.get(key);
            const status = stage?.status ?? "pending";
            const style = getStageStatusStyle(status);
            const Icon = STAGE_ICONS[key];
            const isCurrent = key === project.current_stage;

            return (
              <div
                key={key}
                className="rounded-xl border bg-white p-4 transition-all"
                style={{
                  borderColor: isCurrent ? "#00d4aa40" : "#e5e7eb",
                  boxShadow: isCurrent ? "0 0 12px rgba(0,212,170,0.08)" : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: status === "completed" ? "#00d4aa10" : isCurrent ? "#3b82f610" : "#f3f4f6",
                    }}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#00d4aa]" />
                    ) : (
                      <Icon
                        className="w-4.5 h-4.5"
                        style={{ color: isCurrent ? "#3b82f6" : "#9ca3af" }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {idx + 1}. {WEB_STAGE_LABELS[key]}
                      </p>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#3b82f6]/10 text-[#3b82f6]">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{WEB_STAGE_DESCRIPTIONS[key]}</p>
                  </div>

                  {/* Status */}
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-medium shrink-0"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact */}
      <p className="text-xs text-gray-400 text-center">
        \u00bfTienes preguntas sobre tu proyecto?{" "}
        <a href="mailto:info@ikingdom.org" className="text-[#00d4aa]/60 hover:text-[#00d4aa] transition-colors">
          Cont\u00e1ctanos
        </a>
      </p>
    </div>
  );
}
