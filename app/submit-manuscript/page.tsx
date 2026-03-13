"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BookOpen, Settings } from "lucide-react";
import { SubmitManuscriptForm } from "@/components/editorial/submit-manuscript-form";
import type { SubmitManuscriptFormValues } from "@/components/editorial/submit-manuscript-form";

export default function SubmitManuscriptPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: SubmitManuscriptFormValues, file: File) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append("authorName", values.authorName.trim());
      body.append("authorEmail", values.authorEmail.trim());
      body.append("bookTitle", values.bookTitle.trim());
      body.append("bookSubtitle", values.bookSubtitle.trim());
      body.append("language", values.language);
      body.append("category", values.category);
      body.append("shortDescription", values.shortDescription.trim());
      body.append("manuscript", file);

      const res = await fetch("/api/editorial/submit-manuscript", {
        method: "POST",
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.error || data.message || "Error al enviar el manuscrito.";
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setProjectId(data.projectId ?? null);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-border bg-card shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              Manuscrito recibido
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Tu manuscrito ha sido recibido y el motor de IA de Reino Editorial
              comenzará a procesarlo. Usa los enlaces a continuación para acceder
              al proyecto y activar el proceso editorial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectId && (
              <>
                <Link href={`/app/editorial/projects/${projectId}`} className="block">
                  <Button className="w-full" size="lg">
                    <Settings className="mr-2 h-5 w-5" />
                    Activar proceso editorial (Staff)
                  </Button>
                </Link>
                <Link href={`/portal/editorial/projects/${projectId}`} className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Ver proyecto como cliente
                  </Button>
                </Link>
              </>
            )}
            <Link href="/app/editorial/projects" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Ver todos los proyectos editoriales
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center py-12 px-4">
      <SubmitManuscriptForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
