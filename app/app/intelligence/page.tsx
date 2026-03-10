import { BarChart3, TrendingUp, Target, Activity, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const INTELLIGENCE_MODULES = [
  { title: "Métricas Globales",     desc: "Catálogo de métricas definidas y snapshots históricos.",         table: "editorial_metric_definitions",     icon: Target },
  { title: "Forecasting",           desc: "Modelos de pronóstico y ejecuciones con valores predichos.",     table: "editorial_forecast_runs",          icon: TrendingUp },
  { title: "Scorecards",            desc: "Scorecards ejecutivos y departamentales con resultados.",        table: "editorial_scorecards",             icon: Activity },
  { title: "Anomalías",             desc: "Señales de anomalías detectadas con severidad y recomendación.", table: "editorial_anomaly_signals",         icon: Activity },
  { title: "Reportes Ejecutivos",   desc: "Reportes ejecutivos generados por período y alcance.",          table: "editorial_executive_reports",      icon: BarChart3 },
  { title: "Recomendaciones AI",    desc: "Señales de recomendación AI/rule-based para decisiones.",       table: "editorial_recommendation_signals", icon: BrainCircuit },
];

export default function IntelligencePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Analíticas globales, forecasting, scorecards y reportes ejecutivos — infraestructura compartida.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">Infraestructura</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTELLIGENCE_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-600 shrink-0" />
                  <CardTitle className="text-sm">{mod.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{mod.desc}</CardDescription>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  <code className="bg-muted px-1 rounded">{mod.table}</code>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
