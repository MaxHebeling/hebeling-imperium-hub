"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Trash2 } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey, StaffProjectListItem } from "@/lib/editorial/types/editorial";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProjectListItemProps {
  book: StaffProjectListItem;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProjectListItem({ book }: ProjectListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/editorial/projects/${book.id}`, { method: "DELETE" });
      const text = await response.text();
      const data = (() => {
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return {};
        }
      })();

      if (!response.ok || !data?.success) {
        const msg = data?.error ?? (text ? `HTTP ${response.status}: ${text}` : `HTTP ${response.status}`);
        throw new Error(msg);
      }

      toast.success("Proyecto eliminado correctamente");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el proyecto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <li>
        <div className="flex items-stretch gap-2">
          <Link
            href={`/app/companies/reino-editorial/projects/${book.id}`}
            className="flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-2xl"
            style={{ outlineColor: "var(--re-blue)" }}
          >
            <div
              className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200 h-full"
              style={{
                backgroundColor: "var(--re-surface)",
                border: "1px solid var(--re-border)",
                boxShadow: "var(--re-shadow-sm)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--re-shadow-md)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--re-border-blue)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--re-shadow-sm)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--re-border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5"
                style={{
                  background: "var(--re-blue-pale)",
                  border: "1px solid var(--re-border-blue)",
                }}
              >
                <BookOpen className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--re-text)" }}
                    >
                      {book.title}
                    </p>
                    {book.author_name && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--re-text-muted)" }}
                      >
                        {book.author_name}
                      </p>
                    )}
                    {(book.created_by_name ?? book.created_by_email) && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--re-text-subtle)" }}
                      >
                        Responsable: {book.created_by_name ?? book.created_by_email}
                      </p>
                    )}
                  </div>
                  {/* Stage badge */}
                  <span
                    className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--re-cyan-pale)",
                      color: "var(--re-cyan)",
                      border: "1px solid var(--re-border-cyan)",
                    }}
                  >
                    {EDITORIAL_STAGE_LABELS[book.current_stage as EditorialStageKey] ??
                      book.current_stage}
                  </span>
                </div>

                {/* Progress + meta */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--re-surface-3)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${book.progress_percent}%`,
                          background: "linear-gradient(90deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold w-8 text-right shrink-0"
                      style={{ color: "var(--re-blue)" }}
                    >
                      {book.progress_percent}%
                    </span>
                  </div>
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "var(--re-text-subtle)" }}
                  >
                    {formatDate(book.last_activity_at)}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            aria-label="Eliminar proyecto"
            className="flex items-center justify-center w-10 rounded-2xl transition-all duration-150 shrink-0"
            style={{
              backgroundColor: "var(--re-surface)",
              border: "1px solid var(--re-border)",
              color: "var(--re-text-subtle)",
              boxShadow: "var(--re-shadow-sm)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--re-danger-pale)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--re-danger)";
              (e.currentTarget as HTMLElement).style.color = "var(--re-danger)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--re-surface)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--re-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--re-text-subtle)";
            }}
          >
            {isDeleting ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--re-danger)" }}
              />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </li>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{book.title}&quot;?
              Esta acción no se puede deshacer y eliminará todos los archivos,
              comentarios y datos asociados al proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
