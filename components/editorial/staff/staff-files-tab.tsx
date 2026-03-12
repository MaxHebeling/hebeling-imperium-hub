 "use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Loader2, Upload, Trash2 } from "lucide-react";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VISIBILITY_LABELS: Record<string, string> = {
  internal: "Solo equipo",
  client: "Visible autor",
  public: "Público",
};

function formatSize(bytes: number | null) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface StaffFilesTabProps {
  files: EditorialFile[];
  /** Usado para /api/staff/projects/[projectId]/files/upload */
  projectId: string;
}

export function StaffFilesTab({ files, projectId }: StaffFilesTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openBusyId, setOpenBusyId] = useState<string | null>(null);
  const [downloadBusyId, setDownloadBusyId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("manuscript_original");
  const [stageKey, setStageKey] = useState<string>("ingesta");
  const [visibility, setVisibility] = useState<"internal" | "client" | "public">("internal");

  const byStage = useMemo(() => {
    return files.reduce<Record<string, EditorialFile[]>>((acc, f) => {
      const key = f.stage_key ?? "general";
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {});
  }, [files]);

  const stageOrder = [
    "ingesta",
    "estructura",
    "estilo",
    "ortotipografia",
    "maquetacion",
    "revision_final",
    "general",
  ];

  async function openFile(fileId: string) {
    setError(null);
    setOpenBusyId(fileId);
    try {
      const res = await fetch(`/api/staff/files/${fileId}/signed-url`);
      const json = await res.json();
      if (!json.success) {
        const msg = json.error ?? "No se pudo generar el enlace.";
        setError(msg);
        toast({ title: "No se pudo abrir", description: msg, variant: "destructive" });
        return;
      }
      window.open(json.signedUrl as string, "_blank", "noopener,noreferrer");
      toast({ title: "Abriendo archivo", description: "Se abrió en una nueva pestaña." });
    } catch {
      setError("Error de red al abrir el archivo.");
      toast({ title: "Error de red", description: "No se pudo abrir el archivo.", variant: "destructive" });
    } finally {
      setOpenBusyId(null);
    }
  }

  async function downloadFile(fileId: string) {
    setError(null);
    setDownloadBusyId(fileId);
    try {
      const res = await fetch(`/api/staff/files/${fileId}/signed-url`);
      const json = await res.json();
      if (!json.success) {
        const msg = json.error ?? "No se pudo generar el enlace.";
        setError(msg);
        toast({ title: "No se pudo descargar", description: msg, variant: "destructive" });
        return;
      }
      const url = json.signedUrl as string;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Descarga iniciada",
        description: "Si no empieza, revisa el bloqueador de popups.",
      });
    } catch {
      setError("Error de red al descargar el archivo.");
      toast({ title: "Error de red", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setDownloadBusyId(null);
    }
  }

  async function deleteFile(fileId: string) {
    if (!confirm("¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    setDeleteBusyId(fileId);
    try {
      const res = await fetch(`/api/staff/files/${fileId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        const msg = json.error ?? "No se pudo eliminar el archivo.";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
        return;
      }
      toast({ title: "Archivo eliminado", description: "Se eliminó correctamente." });
      router.refresh();
    } catch {
      setError("Error de red al eliminar el archivo.");
      toast({ title: "Error de red", description: "No se pudo eliminar.", variant: "destructive" });
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function handleUpload() {
    setError(null);
    if (!file) {
      setError("Selecciona un archivo.");
      return;
    }
    setIsUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("fileType", fileType);
      form.set("visibility", visibility);
      if (stageKey && stageKey !== "general") form.set("stageKey", stageKey);

      const res = await fetch(`/api/staff/projects/${projectId}/files/upload`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.success) {
        const msg = json.error ?? "No se pudo subir el archivo.";
        setError(msg);
        toast({ title: "No se pudo subir", description: msg, variant: "destructive" });
        return;
      }
      setOpen(false);
      setFile(null);
      toast({ title: "Archivo subido", description: "Se registró correctamente." });
      router.refresh();
    } catch {
      setError("Error de red al subir el archivo.");
      toast({
        title: "Error de red",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {files.length} archivo{files.length !== 1 ? "s" : ""}.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-fit gap-2">
              <Upload className="h-4 w-4" />
              Subir archivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir archivo</DialogTitle>
              <DialogDescription>
                Se versiona automáticamente (v1, v2, …) para conservar historial.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Archivo</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manuscript_original">Manuscrito (original)</SelectItem>
                      <SelectItem value="manuscript_edited">Manuscrito (editado)</SelectItem>
                      <SelectItem value="working_file">Archivo de trabajo</SelectItem>
                      <SelectItem value="cover_draft">Portada (borrador)</SelectItem>
                      <SelectItem value="export_pdf">Exportación (PDF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <Select value={stageKey} onValueChange={setStageKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingesta">Ingesta</SelectItem>
                      <SelectItem value="estructura">Estructura</SelectItem>
                      <SelectItem value="estilo">Estilo</SelectItem>
                      <SelectItem value="ortotipografia">Ortotipografía</SelectItem>
                      <SelectItem value="maquetacion">Maquetación</SelectItem>
                      <SelectItem value="revision_final">Revisión final</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibilidad</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as typeof visibility)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Solo equipo</SelectItem>
                    <SelectItem value="client">Visible autor</SelectItem>
                    <SelectItem value="public">Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Subiendo…" : "Subir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Sin archivos aún.</p>
            <p className="text-xs text-muted-foreground mt-1">Usa «Subir archivo» cuando esté disponible.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por etapa</CardTitle>
            <CardDescription>
              Tipo, versión y visibilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stageOrder.map((stageKey) => {
              const list = byStage[stageKey];
              if (!list?.length) return null;
              const stageLabel = stageKey === "general" ? "General" : stageKey;

              return (
                <div key={stageKey}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {stageLabel}
                  </h4>
                  <ul className="space-y-2">
                    {list.map((f) => (
                      <li
                        key={f.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>
                            {f.file_type} <span className="text-muted-foreground">v{f.version}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {VISIBILITY_LABELS[f.visibility] ?? f.visibility}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs gap-1.5"
                            onClick={() => openFile(f.id)}
                            disabled={openBusyId === f.id}
                          >
                            {openBusyId === f.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Abriendo…
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4" />
                                Abrir
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => downloadFile(f.id)}
                            aria-label="Descargar"
                            disabled={downloadBusyId === f.id}
                          >
                            {downloadBusyId === f.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteFile(f.id)}
                            aria-label="Eliminar"
                            disabled={deleteBusyId === f.id}
                          >
                            {deleteBusyId === f.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {formatSize(f.size_bytes)} · {formatDate(f.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
