"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { EditorialPublicationMetadata, UpsertPublicationMetadataInput } from "@/types/editorial";

interface MetadataFormProps {
  publicationVersionId: string;
  projectId: string;
  initial: EditorialPublicationMetadata | null;
}

export function MetadataForm({ publicationVersionId, projectId, initial }: MetadataFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    author_name: initial?.author_name ?? "",
    publisher_name: initial?.publisher_name ?? "",
    imprint: initial?.imprint ?? "",
    publication_date: initial?.publication_date ?? "",
    edition_number: initial?.edition_number ?? 1,
    isbn_13: initial?.isbn_13 ?? "",
    isbn_10: initial?.isbn_10 ?? "",
    language: initial?.language ?? "es",
    description: initial?.description ?? "",
    rights: initial?.rights ?? "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
    setError(null);
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);

    if (!form.title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    startTransition(async () => {
      const body: UpsertPublicationMetadataInput = {
        publication_version_id: publicationVersionId,
        project_id: projectId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        author_name: form.author_name.trim() || null,
        publisher_name: form.publisher_name.trim() || null,
        imprint: form.imprint.trim() || null,
        publication_date: form.publication_date || null,
        edition_number: Number(form.edition_number) || 1,
        isbn_13: form.isbn_13.trim() || null,
        isbn_10: form.isbn_10.trim() || null,
        language: form.language.trim() || "es",
        description: form.description.trim() || null,
        rights: form.rights.trim() || null,
      };

      const res = await fetch("/api/editorial/publishing/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al guardar metadatos");
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Core bibliographic */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Información bibliográfica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input id="title" value={form.title} onChange={set("title")} placeholder="Título completo de la obra" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input id="subtitle" value={form.subtitle} onChange={set("subtitle")} placeholder="Subtítulo (opcional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author_name">Autor</Label>
            <Input id="author_name" value={form.author_name} onChange={set("author_name")} placeholder="Nombre del autor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Input id="language" value={form.language} onChange={set("language")} placeholder="es" maxLength={5} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción / Sinopsis</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={set("description")}
            placeholder="Resumen editorial de la obra..."
            rows={4}
          />
        </div>
      </section>

      <Separator />

      {/* Publisher info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Información editorial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="publisher_name">Editorial / Publisher</Label>
            <Input id="publisher_name" value={form.publisher_name} onChange={set("publisher_name")} placeholder="Nombre de la editorial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imprint">Sello / Imprint</Label>
            <Input id="imprint" value={form.imprint} onChange={set("imprint")} placeholder="Sello editorial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication_date">Fecha de publicación</Label>
            <Input id="publication_date" type="date" value={form.publication_date} onChange={set("publication_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edition_number">Número de edición</Label>
            <Input id="edition_number" type="number" min={1} value={form.edition_number} onChange={set("edition_number")} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Identifiers */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Identificadores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="isbn_13">ISBN-13</Label>
            <Input id="isbn_13" value={form.isbn_13} onChange={set("isbn_13")} placeholder="978-XXXXXXXXXX" maxLength={17} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isbn_10">ISBN-10</Label>
            <Input id="isbn_10" value={form.isbn_10} onChange={set("isbn_10")} placeholder="XXXXXXXXXX" maxLength={13} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Rights */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Derechos
        </h3>
        <div className="space-y-2">
          <Label htmlFor="rights">Declaración de derechos</Label>
          <Input id="rights" value={form.rights} onChange={set("rights")} placeholder="© 2025 Autor. Todos los derechos reservados." />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Guardando..." : "Guardar metadatos"}
        </Button>
        {saved && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" />
            Guardado
          </Badge>
        )}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
