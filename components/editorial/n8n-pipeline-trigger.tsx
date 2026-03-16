"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface N8nPipelineTriggerProps {
  projectId: string;
  projectTitle: string;
  currentStage: string;
  hasManuscript: boolean;
}

export function N8nPipelineTrigger({
  projectId,
  projectTitle,
  currentStage,
  hasManuscript,
}: N8nPipelineTriggerProps) {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const triggerPipeline = async () => {
    if (!hasManuscript) {
      setStatus("error");
      setMessage("Primero sube un manuscrito al proyecto.");
      return;
    }

    setStatus("running");
    setMessage("Enviando a n8n...");

    try {
      const res = await fetch("/api/editorial/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "run_pipeline" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Pipeline editorial activado en n8n. El proceso ha iniciado.");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al activar el pipeline.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión con el servidor.");
    }
  };

  return (
    <Card
      style={{
        backgroundColor: "var(--re-surface)",
        border: "1px solid var(--re-border)",
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="text-base flex items-center gap-2"
          style={{ color: "var(--re-text)" }}
        >
          <Zap className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
          Pipeline Editorial (n8n)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
              {projectTitle}
            </p>
            <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>
              Etapa actual: {currentStage}
            </p>
          </div>
          <Badge
            variant={hasManuscript ? "default" : "secondary"}
            className={hasManuscript ? "bg-green-100 text-green-700" : ""}
          >
            {hasManuscript ? "Manuscrito listo" : "Sin manuscrito"}
          </Badge>
        </div>

        <Button
          onClick={triggerPipeline}
          disabled={status === "running"}
          className="w-full"
          style={{
            background:
              status === "running"
                ? undefined
                : "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
            color: status === "running" ? undefined : "white",
          }}
        >
          {status === "running" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Ejecutar Pipeline Editorial
            </>
          )}
        </Button>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              status === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : status === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {status === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
            {status === "error" && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
            {message}
          </div>
        )}

        <div className="pt-2 border-t" style={{ borderColor: "var(--re-border)" }}>
          <a
            href="https://maxhebeling.app.n8n.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 hover:underline"
            style={{ color: "var(--re-text-muted)" }}
          >
            <ExternalLink className="h-3 w-3" />
            Ver workflows en n8n Cloud
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
