"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookMarked, Lock, Mail } from "lucide-react";
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

export default function StaffLoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reason = searchParams.get("reason");

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

      // Full navigation so middleware runs with fresh session; avoids race with layout/revalidation
      window.location.href = "/app/companies";
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <BookMarked className="w-7 h-7" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Editorial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reino Editorial AI Engine
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Acceso equipo</CardTitle>
          <CardDescription className="text-sm">
            Credenciales internas de la editorial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {reason === "forbidden" && !error && (
              <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Tu cuenta está autenticada, pero no tiene permisos de staff para este panel.
              </div>
            )}
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
                  placeholder="tu@editorial.com"
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
    </div>
  );
}
