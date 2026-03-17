"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  User,
  Palette,
  FileText,
  Loader2,
} from "lucide-react";

const BOOK_SIZES = [
  { value: "5x8", label: "5\" x 8\" (Trade Paperback)" },
  { value: "5.5x8.5", label: "5.5\" x 8.5\" (Digest)" },
  { value: "6x9", label: "6\" x 9\" (US Trade)" },
  { value: "8.5x11", label: "8.5\" x 11\" (Letter)" },
  { value: "custom", label: "Tamano personalizado" },
];

const CATEGORIES = [
  "Ficcion",
  "No Ficcion",
  "Biografia",
  "Autoayuda",
  "Infantil",
  "Juvenil",
  "Poesia",
  "Ensayo",
  "Historia",
  "Ciencia",
  "Negocios",
  "Otro",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/editorial/submit-manuscript", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear el proyecto");
      }

      router.push(`/app/companies/reino-editorial/projects/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-full pb-8"
      style={{ backgroundColor: "var(--re-bg)" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <Link
          href="/app/companies/reino-editorial/overview"
          className="inline-flex items-center gap-2 text-sm font-medium mb-4 hover:underline"
          style={{ color: "var(--re-blue)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
            }}
          >
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--re-text)" }}
            >
              Nuevo Proyecto Editorial
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--re-text-muted)" }}
            >
              Completa la informacion para iniciar el pipeline de 11 etapas
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-6 max-w-4xl">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Seccion 1: Informacion del Autor */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <User className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              Informacion del Autor
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Datos del autor del manuscrito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorName">Nombre del Autor *</Label>
                <Input
                  id="authorName"
                  name="authorName"
                  placeholder="Juan Perez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorEmail">Email del Autor *</Label>
                <Input
                  id="authorEmail"
                  name="authorEmail"
                  type="email"
                  placeholder="autor@email.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seccion 2: Informacion del Libro */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <BookOpen className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              Informacion del Libro
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Detalles de la obra a publicar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bookTitle">Titulo del Libro *</Label>
                <Input
                  id="bookTitle"
                  name="bookTitle"
                  placeholder="Mi Gran Novela"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookSubtitle">Subtitulo (opcional)</Label>
                <Input
                  id="bookSubtitle"
                  name="bookSubtitle"
                  placeholder="Una historia de aventuras"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select name="language" defaultValue="es">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Espanol</SelectItem>
                    <SelectItem value="en">Ingles</SelectItem>
                    <SelectItem value="pt">Portugues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookSize">Tamano del Libro</Label>
              <Select name="bookSize" defaultValue="6x9">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Descripcion Corta (opcional)</Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                placeholder="Breve descripcion del libro para uso interno..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seccion 3: Modo Creativo */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Palette className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              Modo Creativo
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Define quien dirige las decisiones creativas del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup name="creativeMode" defaultValue="author_directed" className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg border" style={{ borderColor: "var(--re-border)" }}>
                <RadioGroupItem value="author_directed" id="author_directed" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="author_directed" className="font-medium cursor-pointer">
                    Dirigido por el Autor
                  </Label>
                  <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                    El autor tiene control sobre las decisiones creativas. La editorial proporciona guia y sugerencias.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border" style={{ borderColor: "var(--re-border)" }}>
                <RadioGroupItem value="editorial_directed" id="editorial_directed" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="editorial_directed" className="font-medium cursor-pointer">
                    Dirigido por la Editorial
                  </Label>
                  <p className="text-sm" style={{ color: "var(--re-text-muted)" }}>
                    La editorial toma las decisiones creativas principales. El autor aprueba los resultados finales.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Seccion 4: Portada */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <Palette className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              Briefing de Portada (opcional)
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Informacion para la generacion de la portada. Se usara en la etapa de Briefing de Portada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverPrompt">Descripcion Visual de la Portada</Label>
              <Textarea
                id="coverPrompt"
                name="coverPrompt"
                placeholder="Describe la imagen que quieres en la portada: colores, elementos, estilo..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverNotes">Notas Adicionales para Portada</Label>
              <Textarea
                id="coverNotes"
                name="coverNotes"
                placeholder="Referencias, inspiraciones, portadas similares que te gustan..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seccion 5: Manuscrito */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: "var(--re-text)" }}>
              <FileText className="h-5 w-5" style={{ color: "var(--re-blue)" }} />
              Manuscrito
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Sube el archivo del manuscrito (.docx o .pdf, max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manuscript">Archivo del Manuscrito *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: "var(--re-border)" }}>
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--re-text-muted)" }} />
                <Input
                  id="manuscript"
                  name="manuscript"
                  type="file"
                  accept=".docx,.pdf"
                  required
                  className="max-w-xs mx-auto"
                />
                <p className="text-xs mt-2" style={{ color: "var(--re-text-subtle)" }}>
                  Formatos aceptados: .docx, .pdf
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seccion 6: Observaciones */}
        <Card
          style={{
            backgroundColor: "var(--re-surface)",
            border: "1px solid var(--re-border)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: "var(--re-text)" }}>
              Observaciones Generales (opcional)
            </CardTitle>
            <CardDescription style={{ color: "var(--re-text-muted)" }}>
              Cualquier informacion adicional que el equipo editorial deba conocer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="observations"
              name="observations"
              placeholder="Notas adicionales, plazos especiales, requerimientos especificos..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href="/app/companies/reino-editorial/overview">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
            style={{
              background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
              color: "white",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando proyecto...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Crear Proyecto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
