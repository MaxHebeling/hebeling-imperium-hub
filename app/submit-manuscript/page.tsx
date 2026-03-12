"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { SubmitManuscriptForm } from "@/components/editorial/submit-manuscript-form";
import type { SubmitManuscriptFormValues } from "@/components/editorial/submit-manuscript-form";

export default function SubmitManuscriptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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
        setError(data.error || data.message || "Failed to submit manuscript.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.projectId ? `/author/projects/${data.projectId}` : "/author/projects");
      }, 2500);
    } catch {
      setError("Connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              Manuscript received
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Your manuscript is now being processed by the Reino Editorial AI Engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Redirecting to your project…
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
