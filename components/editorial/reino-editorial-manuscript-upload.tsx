"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReinoEditorialManuscriptUploadProps {
  projectId: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf", ".txt", ".md"];
const ACCEPT =
  ".doc,.docx,.pdf,.txt,.md,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain,text/markdown";

function validateFile(file: File): string | null {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Solo se permiten archivos .doc, .docx, .pdf, .txt o .md.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Archivo demasiado grande (máx. 25 MB).";
  }
  return null;
}

export function ReinoEditorialManuscriptUpload({
  projectId,
}: ReinoEditorialManuscriptUploadProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");

  async function handleUpload() {
    console.info("[reino-manuscript] handleUpload start", {
      hasFile: !!file,
      projectId,
    });
    setError(null);
    setStatus("idle");
    if (!file) {
      setError("Selecciona un archivo (.docx, .pdf, .txt o .md).");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setStatus("uploading");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("fileType", "manuscript_original");
      form.set("visibility", "client");
      form.set("stageKey", "ingesta");

      console.info("[reino-manuscript] sending upload request", {
        url: `/api/staff/projects/${projectId}/files/upload`,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
      });
      const res = await fetch(`/api/staff/projects/${projectId}/files/upload`, {
        method: "POST",
        body: form,
      });
      console.info("[reino-manuscript] upload response", {
        status: res.status,
        ok: res.ok,
      });
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        // ignore, will fall back to generic error if needed
      }
      if (!res.ok || !json?.success) {
        const msg =
          json?.error ??
          (text ? `HTTP ${res.status}: ${text}` : `HTTP ${res.status}: No response body`);
        setError(msg);
        setStatus("error");
        toast({
          title: "No se pudo subir el manuscrito",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Manuscrito subido",
        description: "El manuscrito se registró correctamente en el proyecto.",
      });
      setStatus("success");
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch {
      console.error("[reino-manuscript] network error during upload");
      setError("Error de red al subir el manuscrito.");
      setStatus("error");
      toast({
        title: "Error de red",
        description: "No se pudo subir el manuscrito. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        console.info("[reino-manuscript] dialog open change", { next, projectId });
        setOpen(next);
        if (!next) {
          setError(null);
          setStatus("idle");
          setFile(null);
        }
      }}
    >
      <Button
        type="button"
        className="gap-2 shrink-0"
        onClick={() => {
          console.info("[reino-manuscript] REAL BUTTON CLICKED", { projectId });
          setOpen(true);
        }}
      >
        <Upload className="h-4 w-4" />
        Upload New Manuscript
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir manuscrito</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manuscript-file">Archivo</Label>
            <Input
              id="manuscript-file"
              type="file"
              accept={ACCEPT}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                console.info("[reino-manuscript] file selected", {
                  hasFile: !!f,
                  name: f?.name,
                  type: f?.type,
                  size: f?.size,
                });
                if (!f) {
                  setFile(null);
                  setError(null);
                  return;
                }
                const validationError = validateFile(f);
                if (validationError) {
                  setFile(null);
                  setError(validationError);
                  return;
                }
                setError(null);
                setFile(f);
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Tipos permitidos: .doc, .docx, .pdf, .txt, .md · Tamaño máximo: 25 MB.
            </p>
          </div>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {status === "idle" && !isUploading && "Selecciona un archivo y haz clic en “Subir manuscrito”."}
          {status === "uploading" && isUploading && "Subiendo manuscrito… No cierres esta ventana."}
          {status === "success" && !isUploading && "Última subida completada correctamente."}
          {status === "error" && !isUploading && "Hubo un error en la última subida. Revisa el mensaje arriba."}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo…
              </>
            ) : (
              "Subir manuscrito"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

