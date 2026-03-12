"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/editorial/create-project-modal";
import { Plus } from "lucide-react";

export function ReinoEditorialProjectsHeader() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proyectos del pipeline editorial. Vista company-first dentro de Reino Editorial.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="shrink-0 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </header>
      <CreateProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={(projectId) => {
          router.push(`/app/companies/reino-editorial/projects/${projectId}`);
        }}
      />
    </>
  );
}
