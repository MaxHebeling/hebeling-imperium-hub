"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  AlertCircle,
  Calendar,
  User,
  Search,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  EditorialBookCurrentStageView,
  EditorialStage,
  EditorialStageStatus,
} from "@/types/editorial";
import {
  EDITORIAL_STAGE_LABELS,
  EDITORIAL_STAGE_COLORS,
  EDITORIAL_STATUS_LABELS,
  EDITORIAL_STAGES,
} from "@/types/editorial";

const STATUS_BADGE: Record<EditorialStageStatus, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blocked: "bg-red-100 text-red-700 border-red-200",
  reopened: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function EditorialBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<EditorialBookCurrentStageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<EditorialStage | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    const res = await fetch("/api/editorial/books");
    if (res.ok) {
      const data = await res.json();
      setBooks(data.books ?? []);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!title.trim()) {
      setCreateError("El título es requerido");
      return;
    }

    setCreateError("");
    startTransition(async () => {
      const res = await fetch("/api/editorial/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          isbn: isbn.trim() || undefined,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreateOpen(false);
        setTitle("");
        setAuthor("");
        setIsbn("");
        setDueDate("");
        setNotes("");
        await fetchBooks();
        router.push(`/app/editorial/books/${data.book.id}`);
      } else {
        const err = await res.json();
        setCreateError(err.error ?? "Error al crear el libro");
      }
    });
  }

  const filtered = books.filter((b) => {
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || b.current_stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Libros editoriales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pipeline editorial · {books.length} libro(s) en proceso
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo libro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar nuevo libro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del libro"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nombre del autor"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="ISBN (opcional)"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-date">Fecha límite</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales (opcional)"
                  rows={3}
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || isPending}
                className="w-full"
              >
                {isPending ? "Creando..." : "Crear libro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={stageFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStageFilter("all")}
            className="text-xs"
          >
            Todas
          </Button>
          {EDITORIAL_STAGES.map((stage) => (
            <Button
              key={stage}
              variant={stageFilter === stage ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStageFilter(stage)}
              className="text-xs"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full mr-1.5",
                  EDITORIAL_STAGE_COLORS[stage]
                )}
              />
              {EDITORIAL_STAGE_LABELS[stage]}
            </Button>
          ))}
        </div>
      </div>

      {/* Book list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">
              {books.length === 0
                ? "No hay libros registrados"
                : "Sin resultados para tu búsqueda"}
            </p>
            {books.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Crea el primer libro para comenzar el pipeline editorial
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((book) => {
            const stageIndex = EDITORIAL_STAGES.indexOf(book.current_stage);
            const progressPct = Math.round(
              ((stageIndex + (book.overall_status === "completed" ? 1 : 0)) /
                EDITORIAL_STAGES.length) *
                100
            );
            const requiredDone = Number(book.required_items_done ?? 0);
            const requiredTotal = Number(book.required_items_total ?? 0);

            return (
              <Link
                key={book.book_id}
                href={`/app/editorial/books/${book.book_id}`}
                className="block"
              >
                <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          EDITORIAL_STAGE_COLORS[book.current_stage],
                          "bg-opacity-15"
                        )}
                      >
                        <BookOpen
                          className={cn(
                            "h-4 w-4",
                            book.current_stage === "ingesta" && "text-slate-600",
                            book.current_stage === "estructura" && "text-amber-600",
                            book.current_stage === "estilo" && "text-pink-600",
                            book.current_stage === "ortotipografia" && "text-purple-600",
                            book.current_stage === "maquetacion" && "text-blue-600",
                            book.current_stage === "revision_final" && "text-emerald-600"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {book.title}
                            </h3>
                            {book.author && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {book.author}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                STATUS_BADGE[book.overall_status]
                              )}
                            >
                              {EDITORIAL_STATUS_LABELS[book.overall_status]}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                EDITORIAL_STAGE_COLORS[book.current_stage]
                              )}
                            />
                            {EDITORIAL_STAGE_LABELS[book.current_stage]}
                          </div>
                          {book.assignee_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {book.assignee_name}
                            </div>
                          )}
                          {book.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(book.due_date).toLocaleDateString("es", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                          )}
                          {requiredTotal > 0 && (
                            <span>
                              {requiredDone}/{requiredTotal} ítems
                            </span>
                          )}
                        </div>

                        {/* Pipeline progress */}
                        <div className="mt-2 w-full bg-muted rounded-full h-1">
                          <div
                            className={cn(
                              "h-1 rounded-full transition-all",
                              EDITORIAL_STAGE_COLORS[book.current_stage]
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
