"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
];

export interface CreateProjectFormValues {
  title: string;
  author_name: string;
  language: string;
  genre: string;
  description: string;
}

const INITIAL_FORM: CreateProjectFormValues = {
  title: "",
  author_name: "",
  language: "es",
  genre: "",
  description: "",
};

export interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional hook for parent side effects (analytics, refresh, etc). */
  onSuccess?: (projectId: string) => void;
  /**
   * If provided, the modal will navigate to this URL after creation.
   * This avoids depending on parent components to redirect correctly.
   */
  successRedirectHref?: (projectId: string) => string;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
  successRedirectHref,
}: CreateProjectModalProps) {
  const [form, setForm] = useState<CreateProjectFormValues>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CreateProject] submit fired", form);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      author_name: form.author_name.trim() || undefined,
      language: form.language || "es",
      genre: form.genre.trim() || undefined,
      description: form.description.trim() || undefined,
      target_audience: form.description.trim() || undefined,
    };
    console.log("[CreateProject] payload →", payload);
    try {
      console.log("[CreateProject] calling POST /api/editorial/projects");
      const res = await fetch("/api/editorial/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[CreateProject] response status:", res.status, "body:", data);
      if (!res.ok) {
        setError(data.error ?? "Failed to create project.");
        return;
      }
      const projectId = data?.projectId as string | undefined;
      console.log("[CreateProject] projectId received:", projectId);
      // Accept any well-formed UUID (v1–v8) so future Supabase UUID versions work.
      const isUuid =
        typeof projectId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

      if (isUuid) {
        onOpenChange(false);
        setForm(INITIAL_FORM);
        onSuccess?.(projectId);
        const href =
          successRedirectHref?.(projectId) ??
          `/app/companies/reino-editorial/projects/${projectId}`;
        console.log("[CreateProject] navigating to:", href);
        router.push(href);
      } else {
        setError("Invalid response from server (missing projectId).");
      }
    } catch (err) {
      console.error("[CreateProject] network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!submitting) {
      if (!next) setForm(INITIAL_FORM);
      setError(null);
      onOpenChange(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create an editorial project. You can upload the manuscript from the project page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-project-title">Title *</Label>
              <Input
                id="create-project-title"
                placeholder="Book title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-author">Author Name</Label>
              <Input
                id="create-project-author"
                placeholder="Author name"
                value={form.author_name}
                onChange={(e) => setForm((p) => ({ ...p, author_name: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-language">Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-genre">Genre</Label>
              <Input
                id="create-project-genre"
                placeholder="e.g. Fiction, Nonfiction, Academic"
                value={form.genre}
                onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-description">Description</Label>
              <Textarea
                id="create-project-description"
                placeholder="Brief description or synopsis"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="bg-background border-border resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
