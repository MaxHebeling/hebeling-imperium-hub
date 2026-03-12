import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { listStaffProjects } from "@/lib/editorial/staff/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffEmptyState } from "@/components/editorial/staff/staff-empty-state";
import { ReinoEditorialProjectsHeader } from "@/components/editorial/reino-editorial-projects-header";
import { BookOpen } from "lucide-react";
import { EDITORIAL_STAGE_LABELS } from "@/lib/editorial/pipeline/constants";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { ProjectListItem } from "@/components/editorial/project-list-item";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReinoEditorialProjectsPage() {
  // Avoid showing stale projects after create/delete.
  noStore();
  const books = await listStaffProjects();

  return (
    <div className="space-y-6 p-6">
      <ReinoEditorialProjectsHeader />

      {books.length === 0 ? (
        <StaffEmptyState
          icon={BookOpen}
          title="Sin proyectos"
          description="No hay libros en el pipeline editorial aún. Los proyectos se crean desde el panel de editorial."
        />
      ) : (
        <ul className="space-y-3">
          {books.map((book) => (
            <ProjectListItem key={book.id} book={book} />
          ))}
        </ul>
      )}
    </div>
  );
}

