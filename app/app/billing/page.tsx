import { CreditCard, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BILLING_MODULES = [
  { title: "Cuentas de Cliente", desc: "Perfiles de facturación y cuentas legales de clientes.",           table: "editorial_client_accounts" },
  { title: "Contratos",          desc: "Contratos emitidos, versiones, firmas y ciclo de vida.",           table: "editorial_client_contracts" },
  { title: "Facturas",           desc: "Facturas emitidas, estados, pagos y balances pendientes.",         table: "editorial_invoices" },
  { title: "Pagos Recibidos",    desc: "Pagos recibidos de clientes y asignaciones a facturas.",           table: "editorial_received_payments" },
  { title: "Renovaciones",       desc: "Tracking de renovaciones de contratos y ciclos de vida.",         table: "editorial_contract_renewals" },
  { title: "Snapshots",          desc: "Resúmenes financieros periódicos por cuenta o global.",            table: "editorial_billing_snapshots" },
];

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Facturación, contratos, pagos y renovaciones — infraestructura compartida de Hebeling OS.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">Infraestructura</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BILLING_MODULES.map((mod) => (
          <Card key={mod.title} className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">{mod.desc}</CardDescription>
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                <code className="bg-muted px-1 rounded">{mod.table}</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
