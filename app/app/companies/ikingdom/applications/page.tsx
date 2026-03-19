import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { BriefLinkCard } from "@/components/ikingdom/brief-link-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IKingdomApplicationsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aplicaciones</h1>
        <p className="mt-1 text-muted-foreground">
          Enlaces operativos de iKingdom mientras los flujos se centralizan en HEBELING OS.
        </p>
      </div>

      <BriefLinkCard description="Mantén este link a la vista para copiarlo y enviarlo apenas alguien solicite cotización." />

      <Card className="border-[#C8A84B]/20 bg-[#C8A84B]/5">
        <CardHeader>
          <CardTitle className="text-base">Flujos actuales</CardTitle>
          <CardDescription>
            Acceso directo a formularios existentes mientras la oficina digital sigue creciendo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/apply" target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4" />
              Aplicar / Apply
              <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
            </Link>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/apply/ikingdom-diagnosis" target="_blank" rel="noopener noreferrer">
              Diagnóstico iKingdom
              <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
