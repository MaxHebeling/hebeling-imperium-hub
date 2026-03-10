import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IKingdomApplicationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Formularios de aplicación e intake. Enlaces a flujos actuales durante la migración.
        </p>
      </div>
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-base">Flujos actuales</CardTitle>
          <CardDescription>
            Acceso a formularios y diagnóstico iKingdom (rutas existentes).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/apply" target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4" />
              Aplicar / Apply
              <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
            </Link>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/apply/ikingdom-diagnosis" target="_blank" rel="noopener noreferrer">
              Diagnóstico iKingdom
              <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
