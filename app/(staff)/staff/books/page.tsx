import Link from "next/link";
import { listStaffProjects } from "@/lib/editorial/staff/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { BookOpen } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Staff Books — Listado real desde editorial_projects (org).
 * Reutiliza: listStaffProjects() → listEditorialProjects + getProfilesByIds + calculateProgressPercent.
 */
export default async function StaffBooksPage() {
  const books = await listStaffProjects();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Libros</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Proyectos del pipeline editorial.
        </p>
      </header>

      {books.length === 0 ? (
        <StaffEmptyState
          icon={BookOpen}
          title="Sin proyectos"
          description="No hay libros en el pipeline editorial aún. Los proyectos se crean desde el panel de editorial."
        />
      ) : (
        <ul className="space-y-3">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/staff/books/${book.id}`}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
              >
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <CardTitle className="text-base">{book.title}</CardTitle>
                          {book.author_name && (
                            <CardDescription className="text-sm mt-0.5">
                              {book.author_name}
                            </CardDescription>
                          )}
                          {(book.created_by_name ?? book.created_by_email) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Responsable: {book.created_by_name ?? book.created_by_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {EDITORIAL_STAGE_LABELS[book.current_stage as EditorialStageKey] ?? book.current_stage}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {book.progress_percent}% · {book.status} · Última actividad: {formatDate(book.last_activity_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

