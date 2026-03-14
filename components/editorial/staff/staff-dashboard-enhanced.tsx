"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  BarChart3,
  Sparkles,
  ArrowRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface DashboardProject {
  id: string;
  title: string;
  clientName: string;
  currentStage: string;
  stageLabel: string;
  progress: number;
  daysInPipeline: number;
  status: "on_track" | "delayed" | "completed" | "at_risk";
}

interface DashboardMetrics {
  activeProjects: number;
  completedThisMonth: number;
  totalClients: number;
  revenueThisMonth: number;
  avgDaysToComplete: number;
  aiTasksThisMonth: number;
  pendingApprovals: number;
  overdueProjects: number;
}

interface StaffDashboardEnhancedProps {
  projects: DashboardProject[];
  metrics: DashboardMetrics;
  companySlug: string;
}

const STATUS_CONFIG = {
  on_track: { label: "En tiempo", color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
  delayed: { label: "Retrasado", color: "bg-amber-500/10 text-amber-600", icon: Clock },
  completed: { label: "Completado", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle2 },
  at_risk: { label: "En riesgo", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

export function StaffDashboardEnhanced({ projects, metrics, companySlug }: StaffDashboardEnhancedProps) {
  const activeProjects = projects.filter((p) => p.status !== "completed");
  const urgentProjects = projects.filter((p) => p.status === "at_risk" || p.status === "delayed");

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-primary/70" />
              <Badge variant="secondary" className="text-[10px]">Activos</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.activeProjects}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Proyectos activos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500/70" />
              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Este mes</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.completedThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completados</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-500/70" />
              <Badge className="bg-blue-500/10 text-blue-600 text-[10px]">Total</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.totalClients}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clientes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-5 w-5 text-amber-500/70" />
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">IA</Badge>
            </div>
            <p className="text-3xl font-bold">{metrics.aiTasksThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tareas IA este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(metrics.pendingApprovals > 0 || metrics.overdueProjects > 0) && (
        <div className="flex flex-wrap gap-2">
          {metrics.pendingApprovals > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-200 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">{metrics.pendingApprovals} aprobaciones pendientes</span>
            </div>
          )}
          {metrics.overdueProjects > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{metrics.overdueProjects} proyectos retrasados</span>
            </div>
          )}
        </div>
      )}

      {/* Urgent Projects */}
      {urgentProjects.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Proyectos que requieren atencion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentProjects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status];
                return (
                  <Link
                    key={project.id}
                    href={`/app/companies/${companySlug}/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <statusConfig.icon className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{project.clientName} - {project.stageLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${statusConfig.color}`}>{statusConfig.label}</Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pipeline de Proyectos
            </CardTitle>
            <Badge variant="secondary">{activeProjects.length} activos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay proyectos activos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status];
                return (
                  <Link
                    key={project.id}
                    href={`/app/companies/${companySlug}/projects/${project.id}`}
                    className="block rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{project.clientName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${statusConfig.color}`}>{statusConfig.label}</Badge>
                        <span className="text-xs text-muted-foreground">{project.daysInPipeline}d</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">{project.progress}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{project.stageLabel}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tiempo promedio</span>
            </div>
            <p className="text-2xl font-bold">{metrics.avgDaysToComplete} dias</p>
            <p className="text-xs text-muted-foreground">para completar un proyecto</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Ingresos del mes</span>
            </div>
            <p className="text-2xl font-bold">${metrics.revenueThisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">MXN este mes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
