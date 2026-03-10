import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReinoEditorialAuthorsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portal de Autores</h1>
            <p className="text-xs text-muted-foreground">
              Gestión de autores, accesos al portal y visibilidad de proyectos.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlus className="h-3.5 w-3.5" />
          Invitar Autor
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center space-y-3">
        <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Autores registrados</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
          Los autores con acceso al portal aparecerán aquí con sus proyectos activos, estado de etapas y comunicaciones.
        </p>
        <p className="text-xs text-muted-foreground/50">
          Conectado a <code className="bg-muted px-1 rounded">editorial_project_members</code> (role: author)
        </p>
      </div>
    </div>
  );
}
