import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REPORT_SECTIONS = [
  { title: "KPI Snapshots",        desc: "Métricas periódicas: proyectos activos, SLA breaches, alertas, ingresos.",  table: "editorial_kpi_snapshots",        icon: Target },
  { title: "Scorecards",           desc: "Scorecards ejecutivos y departamentales de desempeño.",                      table: "editorial_scorecards",           icon: TrendingUp },
  { title: "Pipeline Analytics",   desc: "Análisis de conversión CRM, oportunidades y pipeline de ventas.",           table: "editorial_crm_pipeline_snapshots", icon: Activity },
  { title: "Forecasting",          desc: "Modelos de pronóstico de ingresos, colecciones y capacidad de entrega.",    table: "editorial_forecast_runs",        icon: BarChart3 },
  { title: "Executive Reports",    desc: "Reportes ejecutivos generados: semanales, mensuales, trimestrales.",        table: "editorial_executive_reports",    icon: BarChart3 },
  { title: "Anomaly Signals",      desc: "Señales de anomalías detectadas con severidad y acción recomendada.",       table: "editorial_anomaly_signals",      icon: Activity },
];

export default function ReinoEditorialReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Reportes & Inteligencia</h1>
          <p className="text-xs text-muted-foreground">
            KPIs, scorecards, forecasting y reportes ejecutivos para Reino Editorial.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">Fase 13</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORT_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.title} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-violet-600 shrink-0" />
                  <CardTitle className="text-sm">{sec.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{sec.desc}</CardDescription>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  <code className="bg-muted px-1 rounded">{sec.table}</code>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
