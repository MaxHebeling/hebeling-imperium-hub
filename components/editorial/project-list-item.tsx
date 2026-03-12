"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2 } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey, StaffProjectListItem } from "@/lib/editorial/types/editorial";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/app/companies/reino-editorial/projects/${book.id}`}
            className="flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
          >
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <CardTitle className="text-base">{book.title}</CardTitle>
                      {book.author_name && (
                        <CardDescription className="text-sm mt-0.5">
                          {book.author_name}
                        </CardDescription>
                      )}
                      {(book.created_by_name ?? book.created_by_email) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Responsable: {book.created_by_name ?? book.created_by_email}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {EDITORIAL_STAGE_LABELS[
                      book.current_stage as EditorialStageKey
                    ] ?? book.current_stage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {book.progress_percent}% · {book.status} · Última actividad:{" "}
                  {formatDate(book.last_activity_at)}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="gap-2 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar proyecto</span>
          </Button>
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
