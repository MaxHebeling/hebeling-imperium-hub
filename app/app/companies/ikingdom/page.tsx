import { Crown, Zap, Users, BookOpen, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED_MODULES = [
  { title: "Lead Intake",   desc: "Captura y diagnóstico de leads de coaching.",     icon: Zap },
  { title: "Programas",     desc: "Programas de coaching y desarrollo personal.",     icon: BookOpen },
  { title: "Comunidad",     desc: "Gestión de comunidad y miembros activos.",          icon: Users },
  { title: "Analíticas",   desc: "Reportes de progreso y métricas de la plataforma.", icon: BarChart3 },
];

export default function IKingdomPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-600/10">
          <Crown className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">iKingdom</h1>
          <p className="text-sm text-muted-foreground">
            Digital coaching and personal development platform.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Próximamente</Badge>
      </div>

      <div className="rounded-lg border border-emerald-200/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 space-y-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Módulo en desarrollo
        </p>
        <p className="text-xs text-muted-foreground max-w-lg">
          iKingdom operará como una plataforma digital de coaching y desarrollo personal. Las integraciones de leads, programas, comunidad y analíticas serán conectadas en una fase futura de Hebeling OS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLANNED_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="opacity-60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-emerald-600" />
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
