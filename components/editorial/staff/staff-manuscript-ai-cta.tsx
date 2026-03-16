"use client";

import { Button } from "@/components/ui/button";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffManuscriptAiCtaProps {
  projectId: string;
  hasLatestManuscript: boolean;
}

/**
 * CTA unificado que usa el sistema de jobs por etapa.
 * Crea un job de manuscript_analysis en la etapa ingesta y luego dispara el procesamiento.
 */
export function StaffManuscriptAiCta({
  projectId,
  hasLatestManuscript,
}: StaffManuscriptAiCtaProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setIsProcessing(true);
    setResult("idle");
    setErrorMsg(null);
    
    try {
      // 1. Crear job usando el sistema unificado de stage-assist
      const createRes = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/stages/ingesta/ai/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskKey: "manuscript_analysis" }),
        }
      );
      const createJson = await createRes.json();
      
      if (!createRes.ok || !createJson?.success) {
        setResult("error");
        setErrorMsg(createJson?.error ?? `Error al crear job: HTTP ${createRes.status}`);
        return;
      }

      // 2. Disparar procesamiento de jobs pendientes
      const processRes = await fetch("/api/editorial/ai/process", { method: "POST" });
      const processJson = await processRes.json();
      
      if (!processRes.ok || !processJson?.success) {
        // Job creado pero no procesado - aun asi es un estado valido
        setResult("success");
        setErrorMsg("Job creado. Se procesara en segundo plano.");
        router.refresh();
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
          <Zap className="h-3 w-3 text-amber-500" />
          Analisis Editorial IA
        </p>
        <p className="text-[11px] text-muted-foreground">
          {hasLatestManuscript
            ? "Manuscrito listo para analisis editorial con AI."
            : "No hay manuscrito aun. Sube uno para habilitar el analisis editorial."}
        </p>
        {result === "success" && (
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Job enviado. Revisa los resultados en AI Review.
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
        Solicitar Analisis IA
      </Button>
    </div>
  );
}

