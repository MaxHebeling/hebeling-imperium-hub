import { UserCog, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  "Project Manager",
  "Editor de Desarrollo",
  "Editor de Línea",
  "Corrector",
  "Diseñador",
  "Formateador",
  "QA Reviewer",
  "Distribution Manager",
];

export default function ReinoEditorialStaffPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <UserCog className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Staff Editorial</h1>
            <p className="text-xs text-muted-foreground">
              Perfiles de staff, asignaciones, carga de trabajo y SLA tracking.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Agregar Staff
        </Button>
      </div>

      {/* Role pills */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Roles disponibles</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <span
              key={role}
              className="text-xs px-2.5 py-1 rounded-full border bg-muted/50 text-muted-foreground"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center space-y-3">
        <UserCog className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Perfiles de staff</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
          Los perfiles de staff operativos aparecerán aquí con su departamento, capacidad y asignaciones activas.
        </p>
        <p className="text-xs text-muted-foreground/50">
          Conectado a <code className="bg-muted px-1 rounded">editorial_staff_profiles</code> · <code className="bg-muted px-1 rounded">editorial_project_assignments</code>
        </p>
      </div>
    </div>
  );
}
