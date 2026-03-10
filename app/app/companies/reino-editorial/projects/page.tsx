import { FolderKanban, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReinoEditorialProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <FolderKanban className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Proyectos Editoriales</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona todos los proyectos de producción editorial y sus etapas del ciclo de vida.
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stage summary pills */}
      <div className="flex flex-wrap gap-2">
        {["Ingesta", "Estructura", "Estilo", "Ortotipografía", "Maquetación", "Revisión Final"].map((stage) => (
          <Badge key={stage} variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            {stage} <span className="ml-1 text-muted-foreground">—</span>
          </Badge>
        ))}
      </div>

      {/* Placeholder table area */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center space-y-3">
        <FolderKanban className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Proyectos editoriales</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
          Los proyectos editoriales creados en el sistema aparecerán aquí con su etapa, estado, autor asignado y fechas clave.
        </p>
        <p className="text-xs text-muted-foreground/50">
          Datos conectados a <code className="bg-muted px-1 rounded">editorial_projects</code>
        </p>
      </div>
    </div>
  );
}
