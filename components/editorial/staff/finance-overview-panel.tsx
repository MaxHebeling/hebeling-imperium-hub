"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Calendar,
  ArrowRight,
  BarChart3,
} from "lucide-react";

interface FinanceMetrics {
  revenueThisMonth: number;
  revenueLastMonth: number;
  pendingInvoices: number;
  pendingAmount: number;
  paidThisMonth: number;
  overdueAmount: number;
  projectedRevenue: number;
  topClients: { name: string; amount: number }[];
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  status: "completed" | "pending" | "overdue";
}

interface FinanceOverviewPanelProps {
  metrics: FinanceMetrics;
}

export function FinanceOverviewPanel({ metrics }: FinanceOverviewPanelProps) {
  const revenueChange = metrics.revenueLastMonth > 0
    ? ((metrics.revenueThisMonth - metrics.revenueLastMonth) / metrics.revenueLastMonth) * 100
    : 0;
  const isPositiveChange = revenueChange >= 0;

  return (
    <div className="space-y-4">
      {/* Revenue KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-500/70" />
              {isPositiveChange ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  +{revenueChange.toFixed(1)}%
                </Badge>
              ) : (
                <Badge className="bg-destructive/10 text-destructive text-[10px] gap-0.5">
                  <TrendingDown className="h-3 w-3" />
                  {revenueChange.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">${metrics.revenueThisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ingresos este mes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-5 w-5 text-blue-500/70" />
              <Badge className="bg-blue-500/10 text-blue-600 text-[10px]">Pendiente</Badge>
            </div>
            <p className="text-2xl font-bold">${metrics.pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{metrics.pendingInvoices} facturas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-primary/70" />
              <Badge variant="secondary" className="text-[10px]">Cobrado</Badge>
            </div>
            <p className="text-2xl font-bold">${metrics.paidThisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pagado este mes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-amber-500/70" />
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">Proyeccion</Badge>
            </div>
            <p className="text-2xl font-bold">${metrics.projectedRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Proyectado</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {metrics.overdueAmount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              ${metrics.overdueAmount.toLocaleString()} en facturas vencidas
            </span>
          </div>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 h-7 text-xs">
            Ver detalles
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Principales Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topClients.map((client, i) => {
                const maxAmount = Math.max(...metrics.topClients.map((c) => c.amount));
                const percentage = maxAmount > 0 ? (client.amount / maxAmount) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-muted-foreground">${client.amount.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transacciones Recientes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                    </p>
                    <Badge className={`text-[10px] ${
                      tx.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                      tx.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {tx.status === "completed" ? "Pagado" : tx.status === "pending" ? "Pendiente" : "Vencido"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
