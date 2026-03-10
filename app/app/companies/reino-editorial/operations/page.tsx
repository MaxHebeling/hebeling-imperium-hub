import { Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OS_MODULES = [
  { title: "Tareas Operativas",    desc: "Gestión de tareas internas a través del OS editorial.",          table: "editorial_operational_tasks",    badge: "Fase 10" },
  { title: "SLA Tracking",         desc: "Políticas SLA y trackers activos por proyecto, tarea u orden.", table: "editorial_sla_trackers",          badge: "Fase 10" },
  { title: "Alertas",              desc: "Alertas operativas: SLA breaches, errores, notificaciones.",    table: "editorial_alerts",               badge: "Fase 10" },
  { title: "Asignaciones Staff",   desc: "Asignaciones de staff a proyectos con rol y carga.",            table: "editorial_project_assignments",  badge: "Fase 10" },
  { title: "Cargas de Trabajo",    desc: "Snapshots periódicos de carga de trabajo por miembro.",         table: "editorial_workload_snapshots",   badge: "Fase 10" },
  { title: "Ledger Financiero",    desc: "Registro financiero operativo de proyectos editoriales.",       table: "editorial_financial_ledger",     badge: "Fase 10" },
];

export default function ReinoEditorialOperationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-600/10 flex items-center justify-center">
          <Settings2 className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Operaciones</h1>
          <p className="text-xs text-muted-foreground">
            OS editorial — tareas, SLA, alertas, staff y ledger financiero.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">OS Editorial</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {OS_MODULES.map((mod) => (
          <Card key={mod.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{mod.title}</CardTitle>
                <Badge variant="outline" className="text-[10px]">{mod.badge}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">{mod.desc}</CardDescription>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                <code className="bg-muted px-1 rounded">{mod.table}</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
