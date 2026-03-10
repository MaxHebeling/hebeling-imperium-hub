"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Tag,
} from "lucide-react";
import type { EditorialPublicationVersion, EditorialPublicationMetadata } from "@/types/editorial";

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  draft:    { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Borrador" },
  ready:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Lista" },
  exported: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Exportada" },
  archived: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Archivada" },
};

interface PublicationVersionCardProps {
  version: EditorialPublicationVersion;
  metadata: EditorialPublicationMetadata | null;
  projectId: string;
  isLatest?: boolean;
}

export function PublicationVersionCard({
  version,
  metadata,
  projectId,
  isLatest,
}: PublicationVersionCardProps) {
  const [expanded, setExpanded] = useState(isLatest ?? false);
  const [isPending, startTransition] = useTransition();

  const statusStyle = STATUS_STYLES[version.status] ?? STATUS_STYLES.draft;

  const handlePromote = () => {
    startTransition(async () => {
      await fetch("/api/editorial/publishing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_id: version.id,
          action: "update_status",
          status: "ready",
        }),
      });
      // Refresh page data
      window.location.reload();
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await fetch("/api/editorial/publishing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_id: version.id,
          action: "update_status",
          status: "archived",
        }),
      });
      window.location.reload();
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Version header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{version.label}</span>
              <Badge variant="outline" className="text-xs font-mono">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {version.version_tag}
              </Badge>
              {isLatest && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  Última
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Creada {new Date(version.created_at).toLocaleDateString("es-ES", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusStyle.color} variant="outline">
            {statusStyle.label}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t p-4 space-y-4 bg-muted/10">
          {/* Metadata summary */}
          {metadata ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {metadata.isbn_13 && (
                <div>
                  <span className="text-muted-foreground">ISBN-13</span>
                  <p className="font-mono font-medium">{metadata.isbn_13}</p>
                </div>
              )}
              {metadata.publisher_name && (
                <div>
                  <span className="text-muted-foreground">Editorial</span>
                  <p className="font-medium">{metadata.publisher_name}</p>
                </div>
              )}
              {metadata.publication_date && (
                <div>
                  <span className="text-muted-foreground">Fecha publicación</span>
                  <p className="font-medium">
                    {new Date(metadata.publication_date).toLocaleDateString("es-ES")}
                  </p>
                </div>
              )}
              {metadata.language && (
                <div>
                  <span className="text-muted-foreground">Idioma</span>
                  <p className="font-medium uppercase">{metadata.language}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin metadatos registrados para esta versión.</p>
          )}

          {/* Editorial notes */}
          {version.editorial_notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Notas editoriales</p>
                <p className="text-sm text-muted-foreground">{version.editorial_notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {version.status === "draft" && (
              <Button
                size="sm"
                onClick={handlePromote}
                disabled={isPending}
                className="gap-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar como Lista
              </Button>
            )}
            {(version.status === "draft" || version.status === "ready") && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleArchive}
                disabled={isPending}
              >
                Archivar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
