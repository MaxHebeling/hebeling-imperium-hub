"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Activity, Globe2, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  in_progress: "En proceso",
  review: "En revision",
  review_required: "Revision requerida",
  completed: "Completado",
  archived: "Archivado",
};

const STATUS_COLORS: Record<string, string> = {
  created: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  review_required: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

interface StaffProjectHeaderProps {
  projectId: string;
  title: string;
  authorName: string | null;
  currentStage: string;
  progressPercent: number;
  status: string;
  createdByName: string | null;
  createdByEmail: string | null;
  language?: string;
  genre?: string | null;
  /** Optional. Default: "/staff/books" (legacy staff). */
  backHref?: string;
  /** Optional. Default: "Volver a libros". */
  backLabel?: string;
}

const DEFAULT_BACK_HREF = "/staff/books";
const DEFAULT_BACK_LABEL = "Volver a libros";

export function StaffProjectHeader({
  projectId: _projectId,
  title,
  authorName,
  currentStage,
  progressPercent,
  status,
  createdByName,
  createdByEmail,
  language,
  genre,
  backHref = DEFAULT_BACK_HREF,
  backLabel = DEFAULT_BACK_LABEL,
}: StaffProjectHeaderProps) {
  const stageLabel = EDITORIAL_STAGE_LABELS[currentStage as EditorialStageKey] ?? currentStage;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.created;
  const responsible = createdByName ?? createdByEmail;

  return (
    <header className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground transition-colors duration-200">
        <Link href={backHref} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      {/* Title + company */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>Reino Editorial</span>
          {authorName && (
            <>
              <span className="text-border">·</span>
              <span>{authorName}</span>
            </>
          )}
          {responsible && responsible !== authorName && (
            <>
              <span className="text-border">·</span>
              <span>{responsible}</span>
            </>
          )}
        </div>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`${statusColor} border font-medium`}>
          <Activity className="h-3 w-3 mr-1" />
          {statusLabel}
        </Badge>
        <Badge variant="secondary" className="font-medium">
          {stageLabel}
        </Badge>
        {language && (
          <Badge variant="outline" className="gap-1 font-normal">
            <Globe2 className="h-3 w-3" />
            {language.toUpperCase()}
          </Badge>
        )}
        {genre && (
          <Badge variant="outline" className="gap-1 font-normal">
            <BookText className="h-3 w-3" />
            {genre}
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso general</span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <div className="relative">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
    </header>
  );
}
