"use client";

import { useState } from "react";
import { CreateProjectModal } from "@/components/editorial/create-project-modal";
import { Plus, BookOpen } from "lucide-react";

export function ReinoEditorialProjectsHeader() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
              boxShadow: "0 2px 10px rgba(27,64,192,0.25)",
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--re-text)" }}
            >
              Projects
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--re-text-muted)" }}
            >
              Pipeline editorial — libros en produccion
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
          style={{
            backgroundColor: "var(--re-blue)",
            color: "#ffffff",
            boxShadow: "0 2px 10px rgba(27,64,192,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--re-blue-deep)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(27,64,192,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--re-blue)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(27,64,192,0.3)";
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </button>
      </header>
      <CreateProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        successRedirectHref={(projectId) => `/app/companies/reino-editorial/projects/${projectId}`}
      />
    </>
  );
}
