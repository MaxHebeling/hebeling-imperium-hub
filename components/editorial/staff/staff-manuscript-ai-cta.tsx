"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffManuscriptAiCtaProps {
  projectId: string;
  hasLatestManuscript: boolean;
}

export function StaffManuscriptAiCta({
  projectId,
  hasLatestManuscript,
}: StaffManuscriptAiCtaProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    console.info("[editorial-ai][cta] Run AI Editorial Analysis clicked", {
      projectId,
    });
    setIsProcessing(true);
    setResult("idle");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/process-manuscript`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setResult("error");
        setErrorMsg(json?.error ?? `Error HTTP ${res.status}`);
        return;
      }
      setResult("success");
      router.refresh();
    } catch (e) {
      setResult("error");
      setErrorMsg(e instanceof Error ? e.message : "Error de red");
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
          Análisis Editorial IA
        </p>
        <p className="text-[11px] text-muted-foreground">
          {hasLatestManuscript
            ? "Manuscrito listo para análisis editorial con AI."
            : "No hay manuscrito aún. Sube uno para habilitar el análisis editorial."}
        </p>
        {result === "success" && (
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Análisis completado. Revisa los resultados en AI Review.
          </p>
        )}
        {result === "error" && errorMsg && (
          <p className="text-[11px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errorMsg}
          </p>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-1 sm:mt-0 gap-1.5"
        disabled={disabled}
        onClick={handleClick}
      >
        {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
        Ejecutar Análisis Editorial IA
      </Button>
    </div>
  );
}

