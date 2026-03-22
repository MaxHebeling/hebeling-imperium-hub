"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Lock, Mail } from "lucide-react";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600 dark:bg-purple-500 shadow-lg">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Portal del Autor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reino Editorial AI Engine
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Iniciar sesión</CardTitle>
          <CardDescription className="text-sm">
            Accede con las credenciales que te proporcionamos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center px-4">
        ¿Problemas para acceder?{" "}
        <a
          href={`mailto:${EDITORIAL_CONTACT_EMAIL}`}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Contacta al equipo
        </a>
        .
      </p>
    </div>
  );
}
