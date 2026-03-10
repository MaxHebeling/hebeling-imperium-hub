import { FolderOpen, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FilesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-600/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Files</h1>
            <p className="text-sm text-muted-foreground">
              Repositorio de archivos compartidos — documentos, contratos, exportaciones y artefactos.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-2">
          <Upload className="h-3.5 w-3.5" />
          Subir Archivo
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-16 text-center space-y-3">
        <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Repositorio de archivos global</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
          Archivos editoriales, contratos firmados, exportaciones de distribución y documentos compartidos entre empresas.
        </p>
        <p className="text-xs text-muted-foreground/50">
          Conectado a <code className="bg-muted px-1 rounded">editorial_files</code> · <code className="bg-muted px-1 rounded">editorial_distribution_artifacts</code>
        </p>
      </div>
    </div>
  );
}
