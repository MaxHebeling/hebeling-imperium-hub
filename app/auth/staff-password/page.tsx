"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

function StaffPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/app/companies";
  const initialError = searchParams.get("error");

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialError ? "error" : "loading"
  );
  const [errorMsg, setErrorMsg] = useState(
    initialError
      ? decodeURIComponent(initialError)
      : ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function establishRecoverySession() {
      try {
        const supabase = createClient();
        const hash = window.location.hash;

        if (hash && hash.includes("access_token")) {
          const { error } = await supabase.auth.getSession();

          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setStatus("error");
          setErrorMsg(
            "No se pudo validar tu acceso para crear la contrasena. Solicita un enlace nuevo."
          );
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!profile || !["superadmin", "admin", "sales", "ops"].includes(profile.role ?? "")) {
          setStatus("error");
          setErrorMsg(
            "Este enlace no corresponde a un usuario interno del sistema."
          );
          return;
        }

        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error instanceof Error
            ? error.message
            : "No se pudo preparar el acceso seguro"
        );
      }
    }

    if (!initialError) {
      void establishRecoverySession();
    }
  }, [initialError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      setErrorMsg("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contrasenas no coinciden.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message);
        setSaving(false);
        return;
      }

      setSuccess("Contrasena actualizada. Entrando a tu espacio de trabajo...");
      router.replace(next);
      router.refresh();
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "No se pudo actualizar la contrasena."
      );
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-[#E1A24A]/20 bg-[#0B1728] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(7,17,31,0.52),rgba(7,17,31,0.88)),url('/lead-hunter-cinematic-luxury-v1.jpg')] bg-cover bg-center" />
            <div className="relative flex h-full min-h-[520px] flex-col justify-between p-8 lg:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#E1A24A]">
                  HEBELING OS
                </p>
                <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-[0.08em] text-white lg:text-5xl">
                  LEAD HUNTER SECURE ACCESS
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200/88 lg:text-base">
                  Define tu contrasena privada para entrar a Lead Hunter con acceso estable desde tus dispositivos.
                </p>
              </div>

              <div className="space-y-5 rounded-[28px] border border-white/10 bg-[#081320]/75 p-6 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[#E1A24A]">
                    Acceso interno
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">
                    Operacion restringida a Lead Hunter
                  </p>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Una vez definida la contrasena, el ingreso normal sera con tu correo y esa clave en el portal de equipo.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-[#E1A24A]/18 bg-[#0D1B2D] text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <CardHeader className="space-y-5 pb-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo-lead-hunter.svg"
                  alt="Lead Hunter"
                  width={56}
                  height={56}
                  className="rounded-2xl border border-[#E1A24A]/20 bg-white/95 p-2"
                />
                <div>
                  <CardTitle className="text-2xl text-white">
                    Crear contrasena
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-300">
                    Configura tu acceso definitivo para entrar a Lead Hunter.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {status === "loading" ? (
                <div className="space-y-4 py-10 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E1A24A] border-t-transparent" />
                  <p className="text-sm text-slate-300">
                    Verificando tu enlace seguro...
                  </p>
                </div>
              ) : status === "error" ? (
                <div className="space-y-4 py-6">
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                    {errorMsg}
                  </div>
                  <Button asChild className="w-full bg-[#E1A24A] text-[#08111E] hover:bg-[#F0B75D]">
                    <a href="/login">Ir al acceso del equipo</a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMsg ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                      {errorMsg}
                    </div>
                  ) : null}
                  {success ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      {success}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Nueva contrasena
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Minimo 8 caracteres"
                        className="border-white/10 bg-[#09111E] pl-10 text-white placeholder:text-slate-500"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-200">
                      Confirmar contrasena
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repite tu contrasena"
                        className="border-white/10 bg-[#09111E] pl-10 text-white placeholder:text-slate-500"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-[#08111E] hover:opacity-95"
                  >
                    {saving ? "Guardando..." : "Guardar contrasena y entrar"}
                  </Button>

                  <p className="text-center text-xs leading-6 text-slate-400">
                    Despues de esto podras entrar normalmente con tu correo y tu contrasena en el acceso del equipo.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StaffPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07111F] p-4">
          <div className="text-center space-y-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E1A24A] border-t-transparent" />
            <p className="text-sm text-slate-300">Cargando acceso seguro...</p>
          </div>
        </div>
      }
    >
      <StaffPasswordContent />
    </Suspense>
  );
}
