import { Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImperiumOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" />
          Imperium
        </h1>
        <p className="text-muted-foreground mt-1">
          Unidad de negocio Imperium. Operaciones y gestión en preparación.
        </p>
      </div>
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            Panel de resumen y acceso a módulos cuando estén definidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura company-first está lista. Los módulos específicos de Imperium se
            integrarán aquí en fases posteriores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
