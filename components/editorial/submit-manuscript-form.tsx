"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = [".docx", ".pdf"];
const ACCEPT = ".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
];

const CATEGORIES = [
  { value: "fiction", label: "Ficción" },
  { value: "nonfiction", label: "No ficción" },
  { value: "academic", label: "Académico" },
  { value: "children", label: "Infantil / Juvenil" },
  { value: "poetry", label: "Poesía" },
  { value: "essay", label: "Ensayo" },
  { value: "other", label: "Otro" },
];

export interface SubmitManuscriptFormValues {
  authorName: string;
  authorEmail: string;
  bookTitle: string;
  bookSubtitle: string;
  language: string;
  category: string;
  shortDescription: string;
}

export interface SubmitManuscriptFormProps {
  onSubmit: (values: SubmitManuscriptFormValues, file: File) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File must be 25MB or less.";
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "Only .docx and .pdf are allowed.";
  return null;
}

export function SubmitManuscriptForm({
  onSubmit,
  isSubmitting = false,
  error: externalError,
}: SubmitManuscriptFormProps) {
  const [form, setForm] = useState<SubmitManuscriptFormValues>({
    authorName: "",
    authorEmail: "",
    bookTitle: "",
    bookSubtitle: "",
    language: "es",
    category: "",
    shortDescription: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFileWithValidation = useCallback((f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileWithValidation(f ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    setFileWithValidation(f ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFileError("Please upload your manuscript (.docx or .pdf, max 25MB).");
      return;
    }
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    await onSubmit(form, file);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-border bg-card shadow-sm">
      <CardHeader className="text-center space-y-2 pb-2">
        <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
          Submit Your Manuscript
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground max-w-lg mx-auto">
          Reino Editorial will review your submission and create an editorial project.
          Our AI engine will analyze your manuscript and guide you through the next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {externalError && (
            <div
              className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20"
              role="alert"
            >
              {externalError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-foreground font-medium">
                Author Name
              </Label>
              <Input
                id="authorName"
                value={form.authorName}
                onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                placeholder="Full name"
                required
                className="bg-background border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorEmail" className="text-foreground font-medium">
                Author Email
              </Label>
              <Input
                id="authorEmail"
                type="email"
                value={form.authorEmail}
                onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))}
                placeholder="author@example.com"
                required
                className="bg-background border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookTitle" className="text-foreground font-medium">
              Book Title
            </Label>
            <Input
              id="bookTitle"
              value={form.bookTitle}
              onChange={(e) => setForm((p) => ({ ...p, bookTitle: e.target.value }))}
              placeholder="Title of your work"
              required
              className="bg-background border-border focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookSubtitle" className="text-foreground font-medium">
              Book Subtitle <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="bookSubtitle"
              value={form.bookSubtitle}
              onChange={(e) => setForm((p) => ({ ...p, bookSubtitle: e.target.value }))}
              placeholder="Subtitle if applicable"
              className="bg-background border-border focus-visible:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-foreground font-medium">
                Language
              </Label>
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
              <Label htmlFor="category" className="text-foreground font-medium">
                Genre / Category
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription" className="text-foreground font-medium">
              Short Book Description
            </Label>
            <Textarea
              id="shortDescription"
              value={form.shortDescription}
              onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
              placeholder="Brief summary or synopsis"
              rows={4}
              className="bg-background border-border focus-visible:ring-primary resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Upload Manuscript</Label>
            <input
              type="file"
              accept={ACCEPT}
              onChange={handleFileInputChange}
              className="sr-only"
              id="manuscript-upload"
            />
            <label
              htmlFor="manuscript-upload"
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer min-h-[180px] p-6",
                isDragging
                  ? "border-primary bg-primary/5"
                  : file
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/30"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <FileText className="h-12 w-12 text-primary" />
                  <span className="text-sm font-medium text-foreground text-center">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · .docx or .pdf, max 25MB
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click or drag a new file to replace
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground text-center">
                    Drag and drop your manuscript here, or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    .docx or .pdf, max 25MB
                  </span>
                </>
              )}
            </label>
            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Manuscript"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
