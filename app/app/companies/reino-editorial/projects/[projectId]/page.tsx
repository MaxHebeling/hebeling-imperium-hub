import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EDITORIAL_STAGE_KEYS, EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import {
  ArrowLeft,
  BookOpen,
  User,
  Globe,
  Calendar,
  FileText,
  AlertTriangle,
  Check,
  Circle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Palette,
  FileImage,
  BookOpenCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStageIndex(stage: EditorialStageKey): number {
  return EDITORIAL_STAGE_KEYS.indexOf(stage);
}

function getStageStatusInfo(stageKey: EditorialStageKey, currentStage: EditorialStageKey, stageData?: { status: string }) {
  const currentIndex = getStageIndex(currentStage);
  const stageIndex = getStageIndex(stageKey);
  
  if (stageIndex < currentIndex) {
    return { status: "completed", icon: Check, color: "text-green-600", bg: "bg-green-100" };
  }
  if (stageIndex === currentIndex) {
    if (stageData?.status === "review_required") {
      return { status: "requires_review", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" };
    }
    if (stageData?.status === "failed") {
      return { status: "error", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" };
    }
    return { status: "in_progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" };
  }
  return { status: "pending", icon: Circle, color: "text-gray-400", bg: "bg-gray-100" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  noStore();
  const { projectId } = await params;

  const supabase = await createClient();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return (
      <div className="min-h-full p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-red-800">
            Proyecto no encontrado
          </h2>
          <p className="text-sm text-red-600 mt-1">
            No se pudo cargar el proyecto editorial.
          </p>
          <Link
            href="/app/companies/reino-editorial/overview"
            className="text-sm text-blue-600 hover:underline mt-3 inline-block"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  // Fetch stages
  const { data: stages } = await supabase
    .from("editorial_stages")
    .select("*")
    .eq("project_id", projectId);

  const stagesMap = new Map(stages?.map(s => [s.stage_key, s]) || []);

  // Fetch files
  const { data: files } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Categorize files
  const manuscriptFiles = files?.filter(f => f.file_type === "manuscript_original" || f.file_type === "manuscript") || [];
  const interiorFiles = files?.filter(f => f.file_type === "interior_pdf" || f.file_type === "interior") || [];
  const coverFiles = files?.filter(f => f.file_type === "cover" || f.file_type === "portada") || [];
  const wrapperFiles = files?.filter(f => f.file_type === "cubierta" || f.file_type === "wrapper") || [];
  const finalFiles = files?.filter(f => f.file_type === "final_pdf" || f.file_type === "final_epub" || f.file_type === "final") || [];

  const currentStage = project.current_stage as EditorialStageKey;
  const creativeMode = project.creative_mode || "author_directed";

  return (
    <div
      className="min-h-full pb-8 space-y-6"
      style={{ backgroundColor: "var(--re-bg)" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-2">
        <Link
          href="/app/companies/reino-editorial/overview"
          className="text-xs flex items-center gap-1 mb-3 hover:underline"
          style={{ color: "var(--re-text-muted)" }}
        >
          <ArrowLeft className="h-3 w-3" />
          Volver al Panel
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--re-text)" }}
            >
              {project.title || "Sin titulo"}
            </h1>
            {project.subtitle && (
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--re-text-muted)" }}
              >
                {project.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                creativeMode === "editorial_directed"
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
              }
            >
              {creativeMode === "editorial_directed" ? "Editorial Dirigido" : "Autor Dirigido"}
            </Badge>
            <Badge
              className={
                project.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : project.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {project.status === "completed"
                ? "Completado"
                : project.status === "in_progress"
                  ? "En progreso"
                  : project.status || "Borrador"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Pipeline Visual - 11 Etapas */}
      <section className="px-6">
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <BookOpenCheck className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Pipeline Editorial — 11 Etapas
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Progreso: {project.progress_percent || 0}% — Etapa actual: {EDITORIAL_STAGE_LABELS[currentStage]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="mb-4">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--re-surface-3, #e5e7eb)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progress_percent || 0}%`,
                    background: "linear-gradient(90deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Stage grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {EDITORIAL_STAGE_KEYS.map((stageKey) => {
                const stageData = stagesMap.get(stageKey);
                const statusInfo = getStageStatusInfo(stageKey, currentStage, stageData);
                const Icon = statusInfo.icon;

                return (
                  <div
                    key={stageKey}
                    className={`p-2 rounded-lg border text-center ${
                      statusInfo.status === "in_progress" ? "ring-2 ring-blue-400" : ""
                    }`}
                    style={{ 
                      borderColor: "var(--re-border)",
                      backgroundColor: statusInfo.status === "in_progress" ? "var(--re-blue-pale, #f0f4ff)" : "var(--re-surface-2, #f8f9fa)"
                    }}
                  >
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${statusInfo.bg} mb-1`}>
                      <Icon className={`h-3 w-3 ${statusInfo.color}`} />
                    </div>
                    <p className="text-xs font-medium truncate" style={{ color: "var(--re-text)" }}>
                      {EDITORIAL_STAGE_LABELS[stageKey]}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Project Info + Files */}
      <section className="px-6 grid gap-4 lg:grid-cols-3">
        {/* Project Details */}
        <Card
          className="lg:col-span-1"
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
              <BookOpen className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Informacion del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField icon={User} label="Autor" value={project.author_name || "—"} />
            <InfoField
              icon={Globe}
              label="Idioma"
              value={project.language === "es" ? "Espanol" : project.language === "en" ? "English" : project.language || "—"}
            />
            <InfoField icon={BookOpen} label="Genero" value={project.genre || "—"} />
            <InfoField icon={FileText} label="Tamano" value={project.book_size || "6x9"} />
            <InfoField icon={Calendar} label="Creado" value={formatDate(project.created_at)} />
            
            {project.observations && (
              <div className="pt-2 border-t" style={{ borderColor: "var(--re-border)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--re-text-muted)" }}>
                  Observaciones
                </p>
                <p className="text-sm" style={{ color: "var(--re-text)" }}>
                  {project.observations}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Viewer */}
        <Card
          className="lg:col-span-2"
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Eye className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Visor de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="interior" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="interior" className="text-xs">Interior</TabsTrigger>
                <TabsTrigger value="cover" className="text-xs">Portada</TabsTrigger>
                <TabsTrigger value="wrapper" className="text-xs">Cubierta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="interior">
                <DocumentViewer files={interiorFiles} type="interior" projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="cover">
                <DocumentViewer files={coverFiles} type="cover" projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="wrapper">
                <DocumentViewer files={wrapperFiles} type="wrapper" projectId={projectId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Cover Briefing */}
      {(project.cover_prompt || project.cover_notes) && (
        <section className="px-6">
          <Card
            style={{
              backgroundColor: "var(--re-surface)",
              border: "1px solid var(--re-border)",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
                <Palette className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
                Briefing de Portada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.cover_prompt && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--re-text-muted)" }}>
                    Descripcion Visual
                  </p>
                  <p className="text-sm" style={{ color: "var(--re-text)" }}>
                    {project.cover_prompt}
                  </p>
                </div>
              )}
              {project.cover_notes && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--re-text-muted)" }}>
                    Notas Adicionales
                  </p>
                  <p className="text-sm" style={{ color: "var(--re-text)" }}>
                    {project.cover_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Final Files Section */}
      <section className="px-6">
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Download className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
              Archivos Finales
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Archivos listos para publicacion y distribucion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {finalFiles.length === 0 && manuscriptFiles.length === 0 ? (
              <div
                className="p-6 rounded-lg text-center"
                style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
              >
                <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--re-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                  No hay archivos finales disponibles todavia.
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
                  Los archivos apareceran aqui cuando el proyecto complete la etapa de Entrega Final.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Manuscript */}
                {manuscriptFiles.map((file) => (
                  <FileRow key={file.id} file={file} label="Manuscrito Original" />
                ))}
                {/* Final files */}
                {finalFiles.map((file) => (
                  <FileRow key={file.id} file={file} label={getFileLabel(file.file_type)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--re-text-muted)" }} />
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--re-text-muted)" }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function DocumentViewer({ 
  files, 
  type, 
  projectId 
}: { 
  files: Array<{ id: string; storage_path: string; file_type: string; version: number; created_at: string }>;
  type: string;
  projectId: string;
}) {
  if (files.length === 0) {
    return (
      <div
        className="h-64 rounded-lg flex flex-col items-center justify-center"
        style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
      >
        <FileImage className="h-8 w-8 mb-2" style={{ color: "var(--re-text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
          No hay {type === "interior" ? "interior" : type === "cover" ? "portada" : "cubierta"} disponible
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--re-text-subtle)" }}>
          El archivo aparecera cuando se complete la etapa correspondiente
        </p>
      </div>
    );
  }

  const latestFile = files[0];

  return (
    <div className="space-y-3">
      <div
        className="h-64 rounded-lg flex items-center justify-center border"
        style={{ 
          backgroundColor: "var(--re-surface-2, #f8f9fa)",
          borderColor: "var(--re-border)"
        }}
      >
        {/* PDF viewer placeholder - in production this would use signed URL */}
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-2" style={{ color: "var(--re-blue)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
            {type === "interior" ? "Interior del Libro" : type === "cover" ? "Portada" : "Cubierta Completa"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--re-text-muted)" }}>
            Version {latestFile.version}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => {
              // In production: fetch signed URL and open in new tab
              window.open(`/api/editorial/files/${latestFile.id}/view`, "_blank");
            }}
          >
            <Eye className="h-3 w-3" />
            Ver documento
          </Button>
        </div>
      </div>
      
      {/* Version history */}
      {files.length > 1 && (
        <div className="text-xs" style={{ color: "var(--re-text-muted)" }}>
          {files.length} versiones disponibles
        </div>
      )}
    </div>
  );
}

function FileRow({ 
  file, 
  label 
}: { 
  file: { id: string; storage_path: string; file_type: string; version: number; created_at: string; size_bytes?: number };
  label: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
    >
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>
            Version {file.version} {file.size_bytes ? `— ${(file.size_bytes / 1024 / 1024).toFixed(2)} MB` : ""}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          window.open(`/api/editorial/files/${file.id}/download`, "_blank");
        }}
      >
        <Download className="h-3 w-3" />
        Descargar
      </Button>
    </div>
  );
}

function getFileLabel(fileType: string): string {
  const labels: Record<string, string> = {
    final_pdf: "PDF Final para Impresion",
    final_epub: "EPUB para Distribucion Digital",
    final: "Archivo Final",
    interior_pdf: "Interior PDF",
    cover: "Portada",
    cubierta: "Cubierta Completa",
  };
  return labels[fileType] || fileType;
}
