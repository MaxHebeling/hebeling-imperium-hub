import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Analíticas y reportes de la plataforma.
        </p>
      </div>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Este módulo está en desarrollo. Métricas y dashboards estarán disponibles aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Las analíticas del sistema se conectarán con datos reales de Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
