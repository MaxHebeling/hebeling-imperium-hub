"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canAccessIdrStaff, getIdrOfficePath } from "@/lib/idr/access";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrStaffOfficeBySlug } from "@/lib/idr/workspaces";

type AccessView = "login" | "forgot";

export default function IdrOfficeAccessPage() {
  const params = useParams<{ officeSlug: string }>();
  const router = useRouter();
  const office = useMemo(() => getIdrStaffOfficeBySlug(params.officeSlug, "es"), [params.officeSlug]);
  const [view, setView] = useState<AccessView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const urlError =
    typeof window === "undefined"
      ? null
      : (() => {
          const reason = new URLSearchParams(window.location.search).get("error");

          if (reason === "unauthorized") {
            return "Tu perfil no tiene acceso a esta oficina.";
          }

          if (reason === "expired" || reason === "magic_link_expired") {
            return "Tu enlace expiró. Ingresa con tu correo y contraseña.";
          }

          return null;
        })();

  const resolveBrandSlug = async (brandId?: string | null) => {
    if (!brandId) {
      return null;
    }

    const supabase = createClient();
    const { data: brand } = await supabase
      .from("brands")
      .select("slug")
      .eq("id", brandId)
      .maybeSingle();

    return (brand?.slug as string | null) ?? null;
  };

  if (!office) {
    return (
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-10 text-[#F5F0E8] lg:px-6">
        <div
          className="rounded-[30px] border p-8"
          style={{
            borderColor: IDR_THEME.borderStrong,
            background:
              "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 58%, rgba(201,166,70,0.10) 100%)",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
            Acceso no disponible
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Esa oficina no existe en IDR.</h1>
        </div>
      </div>
    );
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : signInError.message
      );
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, brand_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setError("No se encontró tu perfil. Contacta a la coordinación de IDR.");
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    const brandSlug = await resolveBrandSlug(profile.brand_id as string | null);

    if (!canAccessIdrStaff(profile.role as string | null, brandSlug)) {
      setError("Tu cuenta no está habilitada para esta oficina.");
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    router.push(getIdrOfficePath(office.slug));
    router.refresh();
  };

  const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getIdrOfficePath(office.slug))}`,
    });

    if (resetError) {
      setError("No se pudo enviar el correo de recuperación. Intenta nuevamente.");
      setIsLoading(false);
      return;
    }

    setSuccess("Te enviamos un enlace para restablecer tu acceso a esta oficina.");
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07101C] text-[#F5F0E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(201,166,70,0.22), transparent 24%), radial-gradient(circle at 82% 14%, rgba(114,47,55,0.22), transparent 22%), radial-gradient(circle at 50% 70%, rgba(255,255,255,0.05), transparent 28%)",
          }}
        />
        <div className="idr-grid absolute inset-0 opacity-[0.12]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:px-6">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em]" style={{ borderColor: IDR_THEME.border, color: IDR_THEME.goldSoft, background: "rgba(255,255,255,0.02)" }}>
            <ShieldCheck className="h-4 w-4" />
            {office.code}
          </div>

          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              {office.title}
            </h1>
            <p className="max-w-xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
              {office.summary}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[office.audience, office.access, office.launchGoal].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border px-4 py-4 text-sm leading-6"
                style={{
                  borderColor: IDR_THEME.border,
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: "0 14px 44px rgba(0,0,0,0.18)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          className="w-full max-w-md rounded-[30px] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
          style={{
            borderColor: IDR_THEME.borderStrong,
            background:
              "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 58%, rgba(201,166,70,0.10) 100%)",
          }}
        >
          <div className="mb-6 flex items-center gap-2 rounded-full border p-1" style={{ borderColor: IDR_THEME.border }}>
            <button
              type="button"
              onClick={() => {
                setView("login");
                setError(urlError);
                setSuccess(null);
              }}
              className="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: view === "login" ? `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})` : "transparent",
                color: view === "login" ? IDR_THEME.bg : IDR_THEME.ivory,
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setView("forgot");
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: view === "forgot" ? `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})` : "transparent",
                color: view === "forgot" ? IDR_THEME.bg : IDR_THEME.ivory,
              }}
            >
              Recuperar acceso
            </button>
          </div>

          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
              {view === "login" ? "Ingreso directo" : "Recuperación"}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold">
              {view === "login" ? `Entrar a ${office.shortTitle}` : "Restablecer acceso"}
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: IDR_THEME.muted }}>
              {view === "login"
                ? "Usa tus credenciales asignadas para entrar directamente a esta oficina."
                : "Te enviaremos un enlace seguro para recuperar tu contraseña y volver a esta oficina."}
            </p>
          </div>

          {error || urlError ? (
            <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(199,80,80,0.35)", background: "rgba(199,80,80,0.12)", color: "#F1C3C3" }}>
              {error || urlError}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(63,164,106,0.35)", background: "rgba(63,164,106,0.12)", color: "#C7E8D2" }}>
              {success}
            </div>
          ) : null}

          {view === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Correo</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9DA9BA]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-2xl border bg-transparent pl-11 pr-4 text-sm outline-none transition-colors"
                    style={{ borderColor: IDR_THEME.border, color: IDR_THEME.ivory }}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Contraseña</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9DA9BA]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-2xl border bg-transparent pl-11 pr-12 text-sm outline-none transition-colors"
                    style={{ borderColor: IDR_THEME.border, color: IDR_THEME.ivory }}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9DA9BA]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold"
                style={{
                  color: IDR_THEME.bg,
                  background: `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`,
                  opacity: isLoading ? 0.78 : 1,
                }}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar a la oficina"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleForgot}>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Correo</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9DA9BA]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-2xl border bg-transparent pl-11 pr-4 text-sm outline-none transition-colors"
                    style={{ borderColor: IDR_THEME.border, color: IDR_THEME.ivory }}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold"
                style={{
                  color: IDR_THEME.bg,
                  background: `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`,
                  opacity: isLoading ? 0.78 : 1,
                }}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace seguro"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
