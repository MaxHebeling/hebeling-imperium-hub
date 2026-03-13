"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a6b]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-700/5 rounded-full blur-3xl pointer-events-none" />

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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Reino Editorial
          </h1>
          <p className="text-cyan-300/40 text-sm mt-1 tracking-wide uppercase">
            Portal de Autor
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#1a3a6b]/20 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Bienvenido</h2>
            <p className="text-sm text-white/40 mt-1">
              Ingresa para ver el progreso de tu libro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/60">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/60">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/30 transition-all"
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

          <div className="mt-5 text-center">
            <a
              href="#"
              className="text-xs text-white/30 hover:text-cyan-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          ¿No tienes acceso? Contacta a tu editor en{" "}
          <a
            href="mailto:editorial@reinoeditorial.com"
            className="text-cyan-500/60 hover:text-cyan-400 transition-colors"
          >
            editorial@reinoeditorial.com
          </a>
        </p>

        <p className="text-center text-xs text-white/10 mt-8">
          &copy; {new Date().getFullYear()} Reino Editorial
        </p>
      </div>
    </div>
  );
}
