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
    console.log("[v0] handleDelete called for projectId:", projectId);
    setIsDeleting(true);
    try {
      console.log("[v0] Sending DELETE request to:", `/api/staff/projects/${projectId}/delete`);
      const response = await fetch(
        `/api/staff/projects/${projectId}/delete`,
        {
          method: "DELETE",
        }
      );

      console.log("[v0] Response status:", response.status);
      const data = await response.json();
      console.log("[v0] Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      toast.success("Proyecto eliminado correctamente");
      setIsOpen(false);
      router.push("/app/companies/reino-editorial/projects");
      router.refresh();
    } catch (error) {
      console.error("[v0] Error deleting project:", error);
      toast.error("Error al eliminar el proyecto");
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
