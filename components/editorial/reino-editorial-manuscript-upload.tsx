"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReinoEditorialManuscriptUploadProps {
  projectId: string;
  onUploadComplete?: (file: { id: string; path: string; version: number }) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function ReinoEditorialManuscriptUpload({
  projectId,
  onUploadComplete,
}: ReinoEditorialManuscriptUploadProps) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/epub+zip",
    "text/plain",
  ];

  const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".epub", ".txt"];

  const validateFile = (file: File): boolean => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension) && !ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage(
        `Formato no soportado. Formatos aceptados: ${ACCEPTED_EXTENSIONS.join(", ")}`
      );
      return false;
    }
    
    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("El archivo supera el tamaño máximo de 100MB.");
      return false;
    }
    
    return true;
  };

  const handleFile = useCallback((file: File) => {
    setErrorMessage(null);
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("projectId", projectId);
      formData.append("fileType", "manuscript_original");

      const response = await fetch("/api/editorial/upload-manuscript", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al subir el archivo");
      }

      const result = await response.json();
      setUploadStatus("success");
      
      onUploadComplete?.({
        id: result.fileId,
        path: result.path,
        version: result.version,
      });

      // Close dialog after success
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 1500);
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido al subir el archivo"
      );
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setErrorMessage(null);
    setDragActive(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Subir manuscrito
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir manuscrito</DialogTitle>
          <DialogDescription>
            Sube el manuscrito original de tu proyecto. Formatos aceptados: PDF, DOCX, DOC, EPUB, TXT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Drop zone */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              selectedFile && "border-primary/50 bg-primary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setErrorMessage(null);
                  }}
                >
                  <X className="h-3 w-3" />
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Arrastra tu archivo aquí
                  </p>
                  <p className="text-xs text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Máximo 100MB
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload status */}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Manuscrito subido correctamente</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploadStatus === "uploading"}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus === "uploading" || uploadStatus === "success"}
              className="gap-2"
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : uploadStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Completado
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir manuscrito
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
