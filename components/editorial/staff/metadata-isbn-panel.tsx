"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Save,
  Loader2,
  Hash,
  Globe,
  Tag,
  Calendar,
  User,
} from "lucide-react";

interface BookMetadata {
  title: string;
  subtitle: string;
  author: string;
  isbn13: string;
  isbn10: string;
  asin: string;
  publisher: string;
  language: string;
  publicationDate: string;
  edition: string;
  pageCount: string;
  bisacCategory1: string;
  bisacCategory2: string;
  keywords: string;
  description: string;
  series: string;
  seriesNumber: string;
  copyright: string;
}

const DEFAULT_METADATA: BookMetadata = {
  title: "",
  subtitle: "",
  author: "",
  isbn13: "",
  isbn10: "",
  asin: "",
  publisher: "Reino Editorial",
  language: "es",
  publicationDate: "",
  edition: "1",
  pageCount: "",
  bisacCategory1: "",
  bisacCategory2: "",
  keywords: "",
  description: "",
  series: "",
  seriesNumber: "",
  copyright: "",
};

const LANGUAGES = [
  { value: "es", label: "Espanol" },
  { value: "en", label: "Ingles" },
  { value: "pt", label: "Portugues" },
  { value: "fr", label: "Frances" },
  { value: "de", label: "Aleman" },
];

interface MetadataIsbnPanelProps {
  projectId: string;
  initialData?: Partial<BookMetadata>;
}

export function MetadataIsbnPanel({ projectId, initialData }: MetadataIsbnPanelProps) {
  const [metadata, setMetadata] = useState<BookMetadata>({ ...DEFAULT_METADATA, ...initialData });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateField(field: keyof BookMetadata, value: string) {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }

  function validateIsbn13(isbn: string): boolean {
    const cleaned = isbn.replace(/[-\s]/g, "");
    if (cleaned.length !== 13 || !/^\d+$/.test(cleaned)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(cleaned[12]);
  }

  async function saveMetadata() {
    setSaving(true);
    try {
      await fetch(`/api/staff/projects/${projectId}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const isbnValid = !metadata.isbn13 || validateIsbn13(metadata.isbn13);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Metadatos e ISBN</CardTitle>
            </div>
            {saved && <Badge className="bg-emerald-500/10 text-emerald-600">Guardado</Badge>}
          </div>
          <CardDescription>
            Informacion bibliografica del libro para catalogacion y distribucion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Informacion basica
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Titulo</Label>
                <Input value={metadata.title} onChange={(e) => updateField("title", e.target.value)} className="h-9" placeholder="Titulo del libro" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Subtitulo</Label>
                <Input value={metadata.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="h-9" placeholder="Subtitulo (opcional)" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Autor</Label>
                <Input value={metadata.author} onChange={(e) => updateField("author", e.target.value)} className="h-9" placeholder="Nombre completo del autor" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Editorial</Label>
                <Input value={metadata.publisher} onChange={(e) => updateField("publisher", e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* ISBN & Identifiers */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identificadores
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">ISBN-13</Label>
                <Input
                  value={metadata.isbn13}
                  onChange={(e) => updateField("isbn13", e.target.value)}
                  className={`h-9 ${metadata.isbn13 && !isbnValid ? "border-destructive" : ""}`}
                  placeholder="978-X-XXXX-XXXX-X"
                />
                {metadata.isbn13 && !isbnValid && (
                  <p className="text-[10px] text-destructive">ISBN-13 invalido</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ISBN-10</Label>
                <Input value={metadata.isbn10} onChange={(e) => updateField("isbn10", e.target.value)} className="h-9" placeholder="X-XXXX-XXXX-X" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ASIN (Amazon)</Label>
                <Input value={metadata.asin} onChange={(e) => updateField("asin", e.target.value)} className="h-9" placeholder="BXXXXXXXXX" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Publishing Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Detalles de publicacion
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Idioma</Label>
                <Select value={metadata.language} onValueChange={(v) => updateField("language", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha de publicacion</Label>
                <Input type="date" value={metadata.publicationDate} onChange={(e) => updateField("publicationDate", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edicion</Label>
                <Input value={metadata.edition} onChange={(e) => updateField("edition", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Paginas</Label>
                <Input type="number" value={metadata.pageCount} onChange={(e) => updateField("pageCount", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Serie</Label>
                <Input value={metadata.series} onChange={(e) => updateField("series", e.target.value)} className="h-9" placeholder="Nombre de la serie" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Numero en serie</Label>
                <Input value={metadata.seriesNumber} onChange={(e) => updateField("seriesNumber", e.target.value)} className="h-9" placeholder="1, 2, 3..." />
              </div>
            </div>
          </div>

          <Separator />

          {/* Categories & Keywords */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categorias y palabras clave
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Categoria BISAC 1</Label>
                <Input value={metadata.bisacCategory1} onChange={(e) => updateField("bisacCategory1", e.target.value)} className="h-9" placeholder="FIC000000 - FICTION / General" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria BISAC 2</Label>
                <Input value={metadata.bisacCategory2} onChange={(e) => updateField("bisacCategory2", e.target.value)} className="h-9" placeholder="FIC000000 - FICTION / General" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Palabras clave (separadas por coma, max 7)</Label>
                <Input value={metadata.keywords} onChange={(e) => updateField("keywords", e.target.value)} className="h-9" placeholder="novela, ficcion, romance, misterio..." />
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Descripcion
            </h3>
            <div className="space-y-1">
              <Label className="text-xs">Sinopsis / Descripcion del libro (HTML permitido para Amazon)</Label>
              <Textarea
                value={metadata.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={5}
                placeholder="Descripcion del libro para tiendas en linea..."
              />
              <p className="text-[10px] text-muted-foreground">{metadata.description.length} / 4000 caracteres</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveMetadata} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar metadatos"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
