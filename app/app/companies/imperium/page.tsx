import { Sword, Briefcase, Target, FileText, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED_MODULES = [
  { title: "Clientes",    desc: "Gestión de clientes empresariales y engagements.",   icon: Briefcase },
  { title: "Proyectos",   desc: "Proyectos de consultoría y transformación.",         icon: Target },
  { title: "Propuestas",  desc: "Propuestas estratégicas y documentos de advisory.", icon: FileText },
  { title: "Reportes",    desc: "Reportes de desempeño y métricas de consultoría.", icon: BarChart3 },
];

export default function ImperiumPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-600/10">
          <Sword className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imperium</h1>
          <p className="text-sm text-muted-foreground">
            Business consulting and strategy operations.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Próximamente</Badge>
      </div>

      <div className="rounded-lg border border-red-200/40 bg-red-50/30 dark:bg-red-950/10 p-6 space-y-3">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Módulo en desarrollo
        </p>
        <p className="text-xs text-muted-foreground max-w-lg">
          Imperium gestionará consultorías estratégicas, programas de transformación y engagements empresariales. La estructura operativa será integrada en una fase futura de Hebeling OS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLANNED_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="opacity-60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm">{mod.title}</CardTitle>
                  <Badge variant="outline" className="ml-auto text-[10px]">Planificado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{mod.desc}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
