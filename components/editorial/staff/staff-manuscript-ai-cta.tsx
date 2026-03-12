"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface StaffManuscriptAiCtaProps {
  projectId: string;
  hasLatestManuscript: boolean;
}

export function StaffManuscriptAiCta({
  projectId,
  hasLatestManuscript,
}: StaffManuscriptAiCtaProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleClick() {
    // Placeholder: en el siguiente paso se conectará con
    // /api/staff/projects/[projectId]/ai/process-manuscript
    console.info("[editorial-ai][cta] Run AI Editorial Analysis clicked", {
      projectId,
    });
    setIsProcessing(true);
    try {
      // Aquí se invocará el endpoint real en la siguiente fase.
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setIsProcessing(false);
    }
  }

  const disabled = !hasLatestManuscript || isProcessing;

  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="font-medium text-foreground text-xs flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-purple-500" />
          AI Editorial Analysis
        </p>
        <p className="text-[11px] text-muted-foreground">
          {hasLatestManuscript
            ? "Latest manuscript ready for analysis. Próximo paso: conectar el motor de AI."
            : "No manuscript uploaded yet. Sube un manuscrito para habilitar el análisis editorial."}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-1 sm:mt-0 gap-1.5"
        disabled={disabled}
        onClick={handleClick}
      >
        {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
        Run AI Editorial Analysis
      </Button>
    </div>
  );
}

