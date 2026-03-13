"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, Send, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type LoginMode = "magic" | "password";

export default function ClientLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-white">
        <Loader2 className="w-6 h-6 animate-spin text-[#1a3a6b]" />
      </div>
    }>
      <ClientLoginContent />
    </Suspense>
  );
}

function ClientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>("magic");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Check for magic link errors in URL
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "magic_link_expired") {
      setLinkExpired(true);
      setMode("magic");
    }
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal/editorial/projects`,
      },
    });

    if (otpError) {
      setError(
        "Error al enviar el enlace. Verifica tu correo e intenta de nuevo."
      );
      setIsLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setIsLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      let errorMessage = signInError.message;
      if (signInError.message === "Invalid login credentials") {
        errorMessage =
          "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.";
      } else if (signInError.message.includes("Email not confirmed")) {
        errorMessage =
          "Por favor confirma tu correo electrónico antes de iniciar sesión.";
      }
      setError(errorMessage);
      setIsLoading(false);
      return;
    }

    // Fetch profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      setError(
        "No se encontró tu perfil. Contacta a tu editor para obtener acceso."
      );
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    if (profile.role === "client") {
      router.push("/portal/editorial/projects");
      router.refresh();
    } else if (
      ["superadmin", "admin", "sales", "ops"].includes(profile.role)
    ) {
      setError("Esta es el área de clientes. Usa el portal de staff.");
      await supabase.auth.signOut();
      setIsLoading(false);
    } else {
      setError("Rol no válido. Contacta a tu editor.");
      await supabase.auth.signOut();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-white px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a6b]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1a3a6b]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Image
            src="/logo-reino-editorial.png"
            alt="Reino Editorial"
            width={80}
            height={80}
            className="w-20 h-20 object-contain mb-2 mx-auto"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[#1a3a6b]">
            Reino Editorial
          </h1>
          <p className="text-[#1a3a6b]/50 text-sm mt-1 tracking-wide uppercase">
            Portal de Autor
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Bienvenido</h2>
            <p className="text-sm text-gray-400 mt-1">
              Ingresa para ver el progreso de tu libro
            </p>
          </div>

          {/* Expired Magic Link */}
          {linkExpired && !magicLinkSent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  Enlace expirado
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Tu enlace de acceso ya no es válido. Ingresa tu correo para recibir uno nuevo.
                </p>
              </div>
              <form onSubmit={(e) => { setLinkExpired(false); handleMagicLink(e); }} className="w-full space-y-3 mt-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reenviar enlace de acceso
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : magicLinkSent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  ¡Enlace enviado!
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Revisa tu correo <strong className="text-gray-600">{email}</strong> y
                  haz clic en el enlace para acceder a tu portal.
                </p>
              </div>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail("");
                }}
                className="text-xs text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors mt-2"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <>
              {/* Mode Tabs */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                <button
                  onClick={() => {
                    setMode("magic");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === "magic"
                      ? "bg-white text-[#1a3a6b] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Enlace por correo
                </button>
                <button
                  onClick={() => {
                    setMode("password");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === "password"
                      ? "bg-white text-[#1a3a6b] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Contraseña
                </button>
              </div>

              {/* Magic Link Form */}
              {mode === "magic" ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="magic-email"
                      className="text-sm font-medium text-gray-600"
                    >
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Te enviaremos un enlace seguro a tu correo. Solo haz clic
                    para entrar, sin necesidad de contraseña.
                  </p>

                  <Button
                    type="submit"
                    className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando enlace...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar enlace de acceso
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* Password Form */
                <form onSubmit={handlePassword} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-600"
                    >
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-600"
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      "Ingresar"
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿No tienes acceso? Contacta a tu editor en{" "}
          <a
            href="mailto:info@editorialreino.com"
            className="text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors"
          >
            info@editorialreino.com
          </a>
        </p>

        <p className="text-center text-xs text-gray-300 mt-8">
          &copy; {new Date().getFullYear()} Reino Editorial
        </p>
      </div>
    </div>
  );
}
