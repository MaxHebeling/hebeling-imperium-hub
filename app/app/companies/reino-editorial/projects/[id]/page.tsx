import { ProjectDetailView } from "@/components/project-detail-view";

// Company-first Reino Editorial project detail page.
// Back navigation points to the company-first projects list.
export default function ReinoEditorialProjectDetailPage() {
  return (
    <ProjectDetailView
      backHref="/app/companies/reino-editorial/projects"
      backLabel="Back to Reino Editorial Projects"
    />
  );
}
