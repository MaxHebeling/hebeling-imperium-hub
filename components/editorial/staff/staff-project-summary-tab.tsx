import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import type { EditorialStageKey, StaffActivityLogEntry } from "@/lib/editorial/types/editorial";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";

const EVENT_LABELS: Record<string, string> = {
  project_created: "Proyecto creado",
  manuscript_uploaded_by_client: "Manuscrito subido (autor)",
  manuscript_uploaded_by_staff: "Manuscrito subido (staff)",
  file_uploaded_by_staff: "Archivo subido (staff)",
  stage_requested: "Etapa solicitada",
  stage_status_updated_by_staff: "Estado de etapa actualizado",
  stage_approved_by_staff: "Etapa aprobada",
  comment_added_by_staff: "Comentario añadido",
  member_assigned_by_staff: "Miembro asignado",
  staff_assigned_by_staff: "Staff asignado",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface StaffProjectSummaryTabProps {
  project: {
    title: string;
    subtitle: string | null;
    author_name: string | null;
    language: string;
    genre: string | null;
    target_audience: string | null;
    word_count: number | null;
    page_estimate: number | null;
    due_date: string | null;
    created_at: string;
  };
  createdByName: string | null;
  createdByEmail: string | null;
  activity?: StaffActivityLogEntry[];
}

export function StaffProjectSummaryTab({
  project,
  createdByName,
  createdByEmail,
  activity = [],
}: StaffProjectSummaryTabProps) {
  const responsible = createdByName ?? createdByEmail;

  return (
    <div className="space-y-6 pt-2">
      {project.subtitle && (
        <p className="text-sm text-muted-foreground">{project.subtitle}</p>
      )}
      <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-base">Ficha</CardTitle>
          <CardDescription>Datos del proyecto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Idioma" value={project.language} />
            <Row label="Genero" value={project.genre} />
            <Row label="Publico" value={project.target_audience} />
            <Row label="Palabras" value={project.word_count != null ? project.word_count.toLocaleString() : null} />
            <Row label="Paginas (est.)" value={project.page_estimate != null ? String(project.page_estimate) : null} />
            <Row label="Entrega" value={formatDate(project.due_date)} />
          </div>
          {responsible && (
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Responsable: {responsible}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-base">Actividad</CardTitle>
          <CardDescription>Ultimos eventos del proyecto.</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 8).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm transition-colors duration-150 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      {EVENT_LABELS[a.event_type] ?? a.event_type}
                      {a.stage_key && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {EDITORIAL_STAGE_LABELS[a.stage_key as EditorialStageKey] ?? a.stage_key}
                        </span>
                      )}
                    </p>
                    {(a.actor_name || a.actor_email || a.actor_type) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.actor_name ?? a.actor_email ?? a.actor_type}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span>{value ?? "—"}</span>
    </div>
  );
}
