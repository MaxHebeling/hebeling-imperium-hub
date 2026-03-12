"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  in_progress: "En proceso",
  review: "En revisión",
  review_required: "Revisión requerida",
  completed: "Completado",
  archived: "Archivado",
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
  backHref = DEFAULT_BACK_HREF,
  backLabel = DEFAULT_BACK_LABEL,
}: StaffProjectHeaderProps) {
  const stageLabel = EDITORIAL_STAGE_LABELS[currentStage as EditorialStageKey] ?? currentStage;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const responsible = createdByName ?? createdByEmail;

  return (
    <header className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
        <Link href={backHref} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {authorName && (
          <p className="text-sm text-muted-foreground">Autor: {authorName}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-medium">
          {stageLabel}
        </Badge>
        <Badge variant="outline">{statusLabel}</Badge>
        {responsible && (
          <span className="text-xs text-muted-foreground">
            Responsable: {responsible}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </header>
  );
}
