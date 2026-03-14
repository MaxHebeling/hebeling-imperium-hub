"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  ArrowRight,
} from "lucide-react";

interface PipelineStage {
  key: string;
  label: string;
  status: "completed" | "active" | "upcoming" | "locked";
  aiPowered: boolean;
}

interface EditorialPipelineHorizontalProps {
  stages: PipelineStage[];
  currentStageKey: string;
}

const STATUS_CONFIG = {
  completed: {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-white",
    icon: CheckCircle2,
    connectorColor: "bg-emerald-500",
  },
  active: {
    bg: "bg-primary",
    border: "border-primary",
    text: "text-white",
    icon: Loader2,
    connectorColor: "bg-primary/40",
  },
  upcoming: {
    bg: "bg-muted",
    border: "border-muted-foreground/30",
    text: "text-muted-foreground",
    icon: Clock,
    connectorColor: "bg-muted-foreground/20",
  },
  locked: {
    bg: "bg-muted/50",
    border: "border-muted-foreground/20",
    text: "text-muted-foreground/50",
    icon: Lock,
    connectorColor: "bg-muted-foreground/10",
  },
};

export function EditorialPipelineHorizontal({ stages, currentStageKey }: EditorialPipelineHorizontalProps) {
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-4">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">Pipeline Editorial</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{completedCount}/{stages.length} etapas</span>
            <Badge variant="secondary" className="text-[10px]">{progress}%</Badge>
          </div>
        </div>

        {/* Horizontal Pipeline */}
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex items-center gap-0 min-w-max">
            {stages.map((stage, idx) => {
              const config = STATUS_CONFIG[stage.status];
              const IconComp = config.icon;
              const isLast = idx === stages.length - 1;

              return (
                <div key={stage.key} className="flex items-center">
                  {/* Stage Node */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                    <div
                      className={`h-8 w-8 rounded-full border-2 ${config.border} ${config.bg} flex items-center justify-center transition-all duration-300 ${
                        stage.status === "active" ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : ""
                      }`}
                    >
                      <IconComp
                        className={`h-4 w-4 ${config.text} ${stage.status === "active" ? "animate-spin" : ""}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-medium leading-tight ${
                        stage.status === "completed" ? "text-emerald-600" :
                        stage.status === "active" ? "text-primary" :
                        "text-muted-foreground"
                      }`}>
                        {stage.label}
                      </p>
                      {stage.aiPowered && stage.status !== "locked" && (
                        <span className="text-[8px] text-amber-500 font-medium">IA</span>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="flex items-center px-1 -mt-5">
                      <div className={`h-0.5 w-6 ${config.connectorColor} transition-all duration-300`} />
                      <ArrowRight className={`h-3 w-3 -ml-1 ${
                        stage.status === "completed" ? "text-emerald-500" :
                        stage.status === "active" ? "text-primary/40" :
                        "text-muted-foreground/20"
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
