"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Loader2,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";

interface EbookStageView {
  key: string;
  label: string;
  status: "completed" | "active" | "upcoming" | "locked";
  progress: number;
}

interface EbookStatusData {
  outputMode: string;
  ebookType: string;
  overallProgress: number;
  stages: EbookStageView[];
  exportFiles: { name: string; ready: boolean }[];
}

interface EbookStatusPanelProps {
  projectId: string;
  locale?: "es" | "en";
}

const STATUS_STYLES = {
  completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  active: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-50" },
  upcoming: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  locked: { icon: Clock, color: "text-gray-300", bg: "bg-gray-50" },
};

export function EbookStatusPanel({ projectId, locale = "es" }: EbookStatusPanelProps) {
  const [data, setData] = useState<EbookStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/editorial/projects/${projectId}/ebook-status`);
        if (res.ok) {
          const json = await res.json();
          setData(json.ebook);
        }
      } catch {
        // Silently fail - ebook may not be configured
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">
              {locale === "es" ? "Cargando estado eBook..." : "Loading eBook status..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-gray-200 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-semibold text-gray-900">
              {locale === "es" ? "Produccion eBook" : "eBook Production"}
            </CardTitle>
          </div>
          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
            {data.outputMode === "ebook" ? "Solo eBook" : data.outputMode === "print_and_ebook" ? "Print + eBook" : data.outputMode}
          </Badge>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{locale === "es" ? "Progreso general" : "Overall progress"}</span>
            <span className="font-semibold text-blue-600">{data.overallProgress}%</span>
          </div>
          <Progress value={data.overallProgress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-2">
          {data.stages.map((stage) => {
            const style = STATUS_STYLES[stage.status];
            const IconComp = style.icon;
            return (
              <div
                key={stage.key}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${style.bg}`}
              >
                <div className="flex items-center gap-2">
                  <IconComp className={`h-4 w-4 ${style.color} ${stage.status === "active" ? "animate-spin" : ""}`} />
                  <span className={`text-xs font-medium ${stage.status === "locked" ? "text-gray-300" : "text-gray-700"}`}>
                    {stage.label}
                  </span>
                </div>
                {stage.status === "completed" && (
                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                    {locale === "es" ? "Listo" : "Done"}
                  </Badge>
                )}
                {stage.status === "active" && (
                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                    {locale === "es" ? "En curso" : "In progress"}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Export files */}
        {data.exportFiles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {locale === "es" ? "Archivos de exportacion" : "Export Files"}
            </p>
            <div className="space-y-1">
              {data.exportFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">{file.name}</span>
                  </div>
                  {file.ready ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
