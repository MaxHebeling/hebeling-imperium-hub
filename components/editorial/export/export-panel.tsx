"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Loader2,
  BookOpen,
  FileType,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { ExportFormat, ExportQuality, EditorialExportJob } from "@/lib/editorial/export/types";
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_QUALITY_LABELS,
} from "@/lib/editorial/export/types";

interface ExportPanelProps {
  projectId: string;
  projectTitle: string;
  exports: EditorialExportJob[];
}

export function ExportPanel({ projectId, projectTitle, exports }: ExportPanelProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [quality, setQuality] = useState<ExportQuality>("digital");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleCreateExport = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/editorial/projects/${projectId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          quality,
          config: {
            includeCover,
            includeTableOfContents: includeToc,
            includeMetadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create export");
      }

      toast.success(`Export ${EXPORT_FORMAT_LABELS[format]} iniciado`);
      router.refresh();
    } catch (error) {
      console.error("Error creating export:", error);
      toast.error("Error al crear el export");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline">En cola</Badge>;
      case "processing":
        return <Badge variant="secondary">Procesando</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completado</Badge>;
      case "failed":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Export Creation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Crear Export
          </CardTitle>
          <CardDescription>
            Genera versiones exportables de &quot;{projectTitle}&quot; en diferentes formatos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Selecciona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF
                    </span>
                  </SelectItem>
                  <SelectItem value="epub">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      EPUB
                    </span>
                  </SelectItem>
                  <SelectItem value="mobi">
                    <span className="flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      MOBI (Kindle)
                    </span>
                  </SelectItem>
                  <SelectItem value="docx">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Word (DOCX)
                    </span>
                  </SelectItem>
                  <SelectItem value="html">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      HTML
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Calidad</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as ExportQuality)}>
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Selecciona calidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="review">Revisión</SelectItem>
                  <SelectItem value="print">Impresión</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Opciones</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="cover" className="text-sm font-normal cursor-pointer">
                  Incluir portada
                </Label>
                <Switch
                  id="cover"
                  checked={includeCover}
                  onCheckedChange={setIncludeCover}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="toc" className="text-sm font-normal cursor-pointer">
                  Tabla de contenidos
                </Label>
                <Switch
                  id="toc"
                  checked={includeToc}
                  onCheckedChange={setIncludeToc}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="metadata" className="text-sm font-normal cursor-pointer">
                  Metadatos
                </Label>
                <Switch
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleCreateExport} disabled={isCreating} className="w-full sm:w-auto">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Crear Export {EXPORT_FORMAT_LABELS[format]}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Exports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Historial de Exports
          </CardTitle>
          <CardDescription>
            {exports.length === 0
              ? "No hay exports generados aún."
              : `${exports.length} export${exports.length === 1 ? "" : "s"} generado${exports.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        {exports.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {exp.export_type === "pdf" && <FileText className="h-5 w-5" />}
                      {exp.export_type === "epub" && <BookOpen className="h-5 w-5" />}
                      {(exp.export_type === "mobi" || exp.export_type === "docx" || exp.export_type === "html") && (
                        <FileType className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {EXPORT_FORMAT_LABELS[exp.export_type as ExportFormat] ?? exp.export_type} v{exp.version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exp.created_at)} · {formatFileSize(exp.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(exp.status)}
                    {exp.status === "completed" && exp.storage_path && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={exp.storage_path} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {exp.status === "failed" && (
                      <Button variant="ghost" size="icon">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
