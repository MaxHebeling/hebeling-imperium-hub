"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BarChart3,
  MessageSquare,
  Paintbrush,
} from "lucide-react";

interface ProjectWorkspaceStats {
  totalStages: number;
  completedStages: number;
  currentStage: string;
  currentStageLabel: string;
  progress: number;
  filesCount: number;
  commentsCount: number;
  assignmentsCount: number;
  daysInPipeline: number;
  aiTasksRun: number;
  pendingActions: PendingAction[];
}

interface PendingAction {
  id: string;
  type: "approval" | "upload" | "review" | "assignment";
  label: string;
  priority: "high" | "medium" | "low";
}

interface ProjectWorkspacePanelProps {
  projectId: string;
  projectTitle: string;
  stats: ProjectWorkspaceStats;
}

const ACTION_ICONS = {
  approval: CheckCircle2,
  upload: FileText,
  review: BookOpen,
  assignment: Users,
};

const PRIORITY_COLORS = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
};

export function ProjectWorkspacePanel({ projectId, projectTitle, stats }: ProjectWorkspacePanelProps) {
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Progreso</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.progress}%</span>
              <Badge variant="secondary" className="text-[10px]">
                {stats.completedStages}/{stats.totalStages}
              </Badge>
            </div>
            <Progress value={stats.progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Archivos</span>
            </div>
            <span className="text-2xl font-bold">{stats.filesCount}</span>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Dias en pipeline</span>
            </div>
            <span className="text-2xl font-bold">{stats.daysInPipeline}</span>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Paintbrush className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tareas IA</span>
            </div>
            <span className="text-2xl font-bold">{stats.aiTasksRun}</span>
          </CardContent>
        </Card>
      </div>

      {/* Current Stage */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Etapa Actual</CardTitle>
            </div>
            <Badge className="bg-primary/10 text-primary">{stats.currentStageLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{stats.currentStageLabel}</p>
              <p className="text-xs text-muted-foreground">
                Etapa {stats.completedStages + 1} de {stats.totalStages}
              </p>
            </div>
            <Progress value={stats.progress} className="w-24 h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      {stats.pendingActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Acciones Pendientes
              </CardTitle>
              <Badge variant="secondary">{stats.pendingActions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingActions.map((action) => {
                const IconComp = ACTION_ICONS[action.type];
                return (
                  <div
                    key={action.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${PRIORITY_COLORS[action.priority]}`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className="h-4 w-4" />
                      <span className="text-sm">{action.label}</span>
                    </div>
                    <Badge className={`text-[10px] ${PRIORITY_COLORS[action.priority]}`}>
                      {action.priority === "high" ? "Alta" : action.priority === "medium" ? "Media" : "Baja"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acceso Rapido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs">
              <FileText className="h-4 w-4" />
              Archivos
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs">
              <MessageSquare className="h-4 w-4" />
              Comentarios
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs">
              <Users className="h-4 w-4" />
              Equipo
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs">
              <Paintbrush className="h-4 w-4" />
              Portada AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
