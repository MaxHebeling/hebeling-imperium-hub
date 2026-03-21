"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Lock,
  Mail,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { EDITORIAL_CONTACT_EMAIL } from "@/lib/editorial/portal-config";

export default function AuthorLoginPage() {
  return (
    <Suspense fallback={<AuthorLoginSkeleton />}>
      <AuthorLoginContent />
    </Suspense>
  );
}

function AuthorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "expired" || urlError === "magic_link_expired") {
      setError(
        "Tu enlace de acceso expiró. Inicia sesión con tu correo y tu contraseña."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : signInError.message
        );
        return;
      }

      router.push("/author/projects");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="editorial-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--re-bg)] px-4 py-10 text-[var(--re-text)]">
      <div className="re-float-slow absolute -left-10 top-20 h-44 w-44 rounded-full bg-[var(--re-blue)]/10 blur-3xl" />
      <div className="re-float-slow absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-[var(--re-gold)]/16 blur-3xl" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[36px] border border-[var(--re-border)] bg-white/82 shadow-[var(--re-shadow-lg)] backdrop-blur">
        <div className="grid lg:grid-cols-[0.95fr_0.85fr]">
          <section className="relative overflow-hidden border-b border-[var(--re-border)] bg-[linear-gradient(145deg,var(--re-blue-deep),var(--re-blue))] px-6 py-8 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_42%)]" />
            <div className="absolute -bottom-12 left-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Reino Editorial
              </div>

              <div className="space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/15 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Portal del Autor
                  </h1>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/78">
                    Entra para ver el título de tu libro, el progreso editorial,
                    las entregas y las notificaciones de cada cambio que marque
                    tu equipo.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FeaturePill title="Libro visible" text="Portada y etapa actual" />
                <FeaturePill title="Ruta completa" text="Cada fase editorial" />
                <FeaturePill title="Avisos" text="Cambios y archivos nuevos" />
              </div>
            </div>
          </section>

          <section className="px-6 py-8 lg:px-8 lg:py-10">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
                <CardTitle className="text-2xl font-semibold text-[var(--re-text)]">
                  Iniciar sesión
                </CardTitle>
                <CardDescription className="text-sm text-[var(--re-text-muted)]">
                  Accede con las credenciales que recibiste en tu invitación.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-[20px] border border-[var(--re-danger)]/20 bg-[var(--re-danger-pale)] px-4 py-3 text-sm text-[var(--re-danger)]">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--re-text-subtle)]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 rounded-2xl border-[var(--re-border)] bg-white pl-10 text-base"
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--re-text-subtle)]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-12 rounded-2xl border-[var(--re-border)] bg-white pl-10 text-base"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-[var(--re-blue)] text-base font-semibold hover:bg-[var(--re-blue-deep)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar al portal"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-sm leading-relaxed text-[var(--re-text-muted)]">
              Si necesitas ayuda con tu acceso, escribe a{" "}
              <a
                href={`mailto:${EDITORIAL_CONTACT_EMAIL}`}
                className="font-medium text-[var(--re-blue)] underline underline-offset-2"
              >
                {EDITORIAL_CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/70">{text}</p>
    </div>
  );
}

function AuthorLoginSkeleton() {
  return (
    <div className="editorial-theme flex min-h-screen items-center justify-center bg-[var(--re-bg)] px-4 py-10">
      <div className="h-[640px] w-full max-w-5xl rounded-[36px] border border-[var(--re-border)] bg-white/82 shadow-[var(--re-shadow-lg)]" />
    </div>
  );
}
