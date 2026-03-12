import { Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IKingdomOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Globe className="h-6 w-6 text-emerald-500" />
          iKingdom
        </h1>
        <p className="text-muted-foreground mt-1">
          Unidad de negocio iKingdom. Módulos y aplicaciones en preparación.
        </p>
      </div>
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            Panel de resumen y acceso a aplicaciones (intake, diagnóstico) cuando estén integrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura company-first está lista. Los flujos existentes (p. ej. formulario de
            aplicación, diagnóstico) se conectarán aquí en fases posteriores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
