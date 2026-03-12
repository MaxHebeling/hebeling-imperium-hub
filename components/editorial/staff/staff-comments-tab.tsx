 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Lock, User } from "lucide-react";
import type { EditorialComment } from "@/lib/editorial/types/editorial";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StaffCommentsTabProps {
  comments: EditorialComment[];
  projectId: string;
}

export function StaffCommentsTab({ comments, projectId }: StaffCommentsTabProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "client">("internal");
  const [stageKey, setStageKey] = useState<string>("ingesta");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const internal = comments.filter((c) => c.visibility === "internal");
  const clientVisible = comments.filter((c) => c.visibility === "client" || c.visibility === "public");

  async function handleAddComment() {
    setError(null);
    const comment = text.trim();
    if (!comment) {
      setError("Escribe un comentario.");
      return;
    }
    setIsPosting(true);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment,
          visibility,
          stageKey: stageKey === "general" ? null : stageKey,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo guardar el comentario.");
        return;
      }
      setText("");
      router.refresh();
    } catch {
      setError("Error de red al guardar el comentario.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo comentario</CardTitle>
          <CardDescription>Elige si es interno o visible para el autor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="client">Visible autor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={stageKey} onValueChange={setStageKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingesta">Ingesta</SelectItem>
                  <SelectItem value="estructura">Estructura</SelectItem>
                  <SelectItem value="estilo">Estilo</SelectItem>
                  <SelectItem value="ortotipografia">Ortotipografía</SelectItem>
                  <SelectItem value="maquetacion">Maquetación</SelectItem>
                  <SelectItem value="revision_final">Revisión final</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comentario</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe una nota operativa…"
              className="min-h-[96px]"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddComment} disabled={isPosting}>
              {isPosting ? "Guardando…" : "Añadir"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Internos
          </CardTitle>
          <CardDescription>
            Solo visibles para el equipo editorial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {internal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún comentario interno.</p>
          ) : (
            <ul className="space-y-3">
              {internal.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Visibles para el autor
          </CardTitle>
          <CardDescription>
            El autor puede ver estos comentarios en su portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientVisible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún comentario visible al autor.</p>
          ) : (
            <ul className="space-y-3">
              {clientVisible.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Sin comentarios en este proyecto.</p>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: EditorialComment }) {
  return (
    <li className="rounded-lg border border-border p-3 text-sm">
      <p className="text-muted-foreground text-xs mb-1">
        {comment.author_type ?? "—"} · {formatDate(comment.created_at)}
        {comment.stage_key && ` · ${comment.stage_key}`}
      </p>
      <p className="whitespace-pre-wrap">{comment.comment}</p>
    </li>
  );
}
