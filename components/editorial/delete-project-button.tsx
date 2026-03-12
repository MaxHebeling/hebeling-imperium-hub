"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteProjectButtonProps {
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectButton({
  projectId,
  projectTitle,
}: DeleteProjectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/editorial/projects/${projectId}`, { method: "DELETE" });
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
      router.push("/app/companies/reino-editorial/projects");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el proyecto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar proyecto
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{projectTitle}&quot;?
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
