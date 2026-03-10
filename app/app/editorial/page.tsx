import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewEditorial } from "@/lib/editorial/permissions";
import { getEditorialMetrics } from "@/lib/editorial/metrics";
import { getOrgActiveAlerts } from "@/lib/editorial/alerts";
import { getOrgRecentEvents } from "@/lib/editorial/events";
import { PipelineMetricsCard } from "@/components/editorial/PipelineMetricsCard";
import { BlockedBookAlert } from "@/components/editorial/BlockedBookAlert";
import { WorkflowEventFeed } from "@/components/editorial/WorkflowEventFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Editorial | Hebeling OS",
};

export default async function EditorialDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || !canViewEditorial(profile.role)) {
    redirect("/app/dashboard");
  }

  const [metrics, activeAlerts, recentEvents] = await Promise.all([
    getEditorialMetrics(supabase, profile.org_id),
    getOrgActiveAlerts(supabase, profile.org_id),
    getOrgRecentEvents(supabase, profile.org_id, 20),
  ]);

  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = activeAlerts.filter((a) => a.severity === "warning");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Editorial
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reino Editorial AI Engine — Vista de operaciones
          </p>
        </div>
        <Link href="/app/editorial/books">
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Ver libros
          </Button>
        </Link>
      </div>

      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900 text-sm">
              {criticalAlerts.length} alerta(s) crítica(s) requieren atención inmediata
            </h3>
          </div>
          <BlockedBookAlert
            alerts={criticalAlerts}
            canResolve={false}
          />
          <Link href="/app/editorial/books" className="block">
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Ver libros bloqueados
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Metrics — left 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <PipelineMetricsCard metrics={metrics} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Warning alerts */}
          {warningAlerts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span>Advertencias</span>
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-700 border-amber-300 bg-amber-50"
                  >
                    {warningAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BlockedBookAlert
                  alerts={warningAlerts}
                  canResolve={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Actividad reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowEventFeed events={recentEvents} maxItems={15} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
