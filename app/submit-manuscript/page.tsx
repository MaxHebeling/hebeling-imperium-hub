"use client";

// Force server restart - fixed turbopack config
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
    console.log("[v0] handleSubmit started with file:", file.name, file.size);
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

      console.log("[v0] FormData prepared, sending to /api/editorial/submit-manuscript");
      const res = await fetch("/api/editorial/submit-manuscript", {
        method: "POST",
        body,
      });

      console.log("[v0] Response status:", res.status, res.statusText);
      const data = await res.json().catch((err) => {
        console.log("[v0] Failed to parse JSON response:", err);
        return {};
      });
      console.log("[v0] Response data:", data);
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || "Failed to submit manuscript.";
        console.log("[v0] Error response:", errorMsg);
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      console.log("[v0] Submit successful, showing success screen");
      setSuccess(true);
      setTimeout(() => {
        console.log("[v0] Redirecting to project:", data.projectId);
        router.push(data.projectId ? `/author/projects/${data.projectId}` : "/author/projects");
      }, 2500);
    } catch (err) {
      console.error("[v0] catch block error:", err);
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
