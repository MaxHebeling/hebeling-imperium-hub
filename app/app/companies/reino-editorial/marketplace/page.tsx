import { ShoppingBag, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MARKETPLACE_SECTIONS = [
  { title: "Profesionales",    desc: "Directorio de proveedores y profesionales editoriales registrados.", table: "editorial_professionals" },
  { title: "Servicios",        desc: "Catálogo de servicios activos ofrecidos en el marketplace.",         table: "editorial_service_listings" },
  { title: "Órdenes",          desc: "Órdenes de servicios generadas, en proceso o completadas.",          table: "editorial_marketplace_orders" },
  { title: "Pagos Escrow",     desc: "Pagos retenidos en escrow para órdenes de marketplace.",             table: "editorial_payments" },
];

export default function ReinoEditorialMarketplacePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-orange-600/10 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Marketplace Editorial</h1>
            <p className="text-xs text-muted-foreground">
              Profesionales, servicios, órdenes y pagos escrow.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">Fase 8</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MARKETPLACE_SECTIONS.map((sec) => (
          <Card key={sec.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{sec.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">{sec.desc}</CardDescription>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                <code className="bg-muted px-1 rounded">{sec.table}</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
