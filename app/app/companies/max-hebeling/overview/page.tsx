import { User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaxHebelingOverviewPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-blue-500" />
          Max Hebeling
        </h1>
        <p className="text-muted-foreground mt-1">
          Unidad de negocio Max Hebeling. Módulos en preparación.
        </p>
      </div>
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            Panel de resumen y acceso a módulos cuando estén definidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura company-first está lista. Los módulos específicos de Max Hebeling se
            integrarán aquí en fases posteriores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
