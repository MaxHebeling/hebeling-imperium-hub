import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  { name: "Ingesta",         color: "bg-slate-100 text-slate-700",    count: "—" },
  { name: "Estructura",      color: "bg-blue-100 text-blue-700",      count: "—" },
  { name: "Estilo",          color: "bg-purple-100 text-purple-700",  count: "—" },
  { name: "Ortotipografía",  color: "bg-amber-100 text-amber-700",    count: "—" },
  { name: "Maquetación",     color: "bg-orange-100 text-orange-700",  count: "—" },
  { name: "Revisión Final",  color: "bg-emerald-100 text-emerald-700",count: "—" },
];

export default function ReinoEditorialPipelinePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <GitBranch className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pipeline Editorial</h1>
          <p className="text-xs text-muted-foreground">
            Visualiza el flujo de producción por etapa para todos los proyectos activos.
          </p>
        </div>
      </div>

      {/* Kanban-style stage columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage.name} className="rounded-lg border bg-muted/30 p-3 space-y-2 min-h-[180px]">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stage.color}`}>
                {stage.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{stage.count}</span>
            </div>
            <div className="space-y-1.5">
              <div className="rounded border border-dashed border-muted-foreground/20 p-2 text-center">
                <span className="text-[10px] text-muted-foreground/50">Sin proyectos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center">
        Conectado a <code className="bg-muted px-1 rounded">editorial_projects.current_stage</code>
      </p>
    </div>
  );
}
