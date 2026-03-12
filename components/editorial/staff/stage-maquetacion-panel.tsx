"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Layout
} from "lucide-react";
import type { EditorialFile, StageWithApprover } from "@/lib/editorial/types/editorial";

const ACCEPTED_FILES = ".pdf,.indd,.idml,.ai,.psd";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for design files

interface StageMaquetacionPanelProps {
  projectId: string;
  stage: StageWithApprover;
  files: EditorialFile[];
  onUploaded?: () => void;
}

export function StageMaquetacionPanel({ 
  projectId, 
  stage, 
  files,
  onUploaded 
}: StageMaquetacionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files for maquetacion stage
  const maquetacionFiles = files.filter(
    f => f.file_type === "maquetacion" || f.file_type === "layout"
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("El archivo es demasiado grande. Maximo 100MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "maquetacion");
      formData.append("stageKey", "maquetacion");

      const res = await fetch(`/api/staff/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al subir el archivo");
        return;
      }

      setUploadSuccess(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
      onUploaded?.();
    } catch {
      setError("Error de red al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/staff/projects/${projectId}/stages/maquetacion/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: notes.trim() || undefined }),
          }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "No se pudo aprobar la etapa.");
          return;
        }

        setNotes("");
        router.refresh();
      } catch {
        setError("Error de red al aprobar la etapa.");
      }
    });
  }

  const isApproved = stage.status === "approved" || stage.status === "completed";
  const canApprove = maquetacionFiles.length > 0 && !isApproved;

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Maquetacion</CardTitle>
          </div>
          <Badge 
            variant={isApproved ? "default" : "secondary"}
            className={isApproved ? "bg-emerald-600" : ""}
          >
            {isApproved ? "Completada" : "En proceso"}
          </Badge>
        </div>
        <CardDescription>
          Sube el archivo maquetado (PDF final, InDesign, etc.)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success message */}
        {uploadSuccess && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Archivo subido correctamente</span>
            </div>
          </div>
        )}

        {/* File upload area */}
        {!isApproved && (
          <div className="border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Arrastra el archivo maquetado o haz clic para seleccionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              PDF, InDesign (.indd, .idml), AI, PSD - Max 100MB
            </p>
          </div>
        )}

        {/* Uploaded files list */}
        {maquetacionFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Archivos maquetados</Label>
            {maquetacionFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Maquetacion v{file.version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.size_bytes 
                        ? `${(file.size_bytes / (1024 * 1024)).toFixed(2)} MB`
                        : "Tamaño desconocido"
                      }
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {file.mime_type?.split("/")[1]?.toUpperCase() || "PDF"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {!isApproved && (
          <div className="space-y-2">
            <Label htmlFor="maq-notes" className="text-sm font-medium">
              Notas (opcional)
            </Label>
            <Textarea
              id="maq-notes"
              placeholder="Notas sobre la maquetacion, especificaciones de impresion, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Already approved message */}
        {isApproved && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Maquetacion aprobada y lista para exportar.</span>
            </div>
          </div>
        )}
      </CardContent>

      {canApprove && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button
            onClick={handleApprove}
            disabled={isPending || maquetacionFiles.length === 0}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Aprobar Maquetacion
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
