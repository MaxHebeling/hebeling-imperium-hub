import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { N8nPipelineTrigger } from "@/components/editorial/n8n-pipeline-trigger";
import {
  ArrowLeft,
  BookOpen,
  User,
  Globe,
  Calendar,
  FileText,
  AlertTriangle,
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

function stageName(stage: string) {
  const names: Record<string, string> = {
    ingesta: "Ingesta",
    estructura: "Estructura",
    estilo: "Estilo",
    ortotipografia: "Ortotipografía",
    maquetacion: "Maquetación",
    revision_final: "Revisión Final",
    export: "Exportación",
    distribution: "Distribución",
  };
  return names[stage] || stage;
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
            Volver al Control Center
          </Link>
        </div>
      </div>
    );
  }

  // Fetch manuscript files
  const { data: files } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .eq("file_type", "manuscript")
    .order("version", { ascending: false });

  const hasManuscript = (files?.length ?? 0) > 0;
  const latestFile = files?.[0];

  // Fetch recent AI jobs
  const { data: jobs } = await supabase
    .from("editorial_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);

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
          Volver al Control Center
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--re-text)" }}
            >
              {project.title || "Sin título"}
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

      {/* Project Info + n8n Trigger */}
      <section className="px-6 grid gap-4 lg:grid-cols-3">
        {/* Project Details */}
        <Card
          className="lg:col-span-2"
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
              Información del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField
                icon={User}
                label="Autor"
                value={project.author_name || "—"}
              />
              <InfoField
                icon={Globe}
                label="Idioma"
                value={project.language === "es" ? "Español" : project.language === "en" ? "English" : project.language || "—"}
              />
              <InfoField
                icon={BookOpen}
                label="Género"
                value={project.genre || "—"}
              />
              <InfoField
                icon={FileText}
                label="Etapa actual"
                value={stageName(project.current_stage)}
              />
              <InfoField
                icon={Calendar}
                label="Creado"
                value={formatDate(project.created_at)}
              />
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--re-text-muted)" }}>
                  Progreso
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
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
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--re-blue)" }}
                  >
                    {project.progress_percent || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Manuscript info */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--re-border)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--re-text)" }}>
                Manuscrito
              </p>
              {hasManuscript && latestFile ? (
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: "var(--re-blue)" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
                        {latestFile.file_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--re-text-muted)" }}>
                        Versión {latestFile.version} — {formatDate(latestFile.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Listo</Badge>
                </div>
              ) : (
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                >
                  <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                    No hay manuscrito subido. Sube uno para activar el pipeline.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* n8n Pipeline Trigger */}
        <div className="lg:col-span-1">
          <N8nPipelineTrigger
            projectId={projectId}
            projectTitle={project.title || "Sin título"}
            currentStage={stageName(project.current_stage)}
            hasManuscript={hasManuscript}
          />
        </div>
      </section>

      {/* Recent AI Jobs */}
      {jobs && jobs.length > 0 && (
        <section className="px-6">
          <Card
            style={{
              backgroundColor: "var(--re-surface)",
              border: "1px solid var(--re-border)",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className="text-base"
                style={{ color: "var(--re-text)" }}
              >
                Historial de Jobs IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--re-surface-2, #f8f9fa)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium" style={{ color: "var(--re-text)" }}>
                        {job.job_type}
                      </span>
                      <span className="text-xs" style={{ color: "var(--re-text-muted)" }}>
                        {job.stage_key}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--re-text-subtle)" }}>
                        {formatDate(job.created_at)}
                      </span>
                      <Badge
                        className={
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "running"
                              ? "bg-blue-100 text-blue-700"
                              : job.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }
                      >
                        {job.status === "completed"
                          ? "Completado"
                          : job.status === "running"
                            ? "Ejecutando"
                            : job.status === "failed"
                              ? "Error"
                              : job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
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
    <div>
      <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "var(--re-text-muted)" }}>
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--re-text)" }}>
        {value}
      </p>
    </div>
  );
}
