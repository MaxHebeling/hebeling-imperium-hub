"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, UserPlus, Eye, EyeOff, Phone, Calendar } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type ViewMode = "login" | "register" | "forgot";

export default function ClientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-white">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a3a6b]" />
        </div>
      }
    >
      <ClientLoginContent />
    </Suspense>
  );
}

function ClientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "magic_link_expired") {
      setError("Tu enlace de acceso anterior ha expirado. Inicia sesion con tu correo y contrasena.");
    }
  }, [searchParams]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setDateOfBirth("");
    setAcceptTerms(false);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirm(false);
  };

  const switchView = (newView: ViewMode) => {
    resetForm();
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      let errorMessage = signInError.message;
      if (signInError.message === "Invalid login credentials") {
        errorMessage = "Correo o contrasena incorrectos. Verifica tus datos e intenta de nuevo.";
      } else if (signInError.message.includes("Email not confirmed")) {
        errorMessage = "Por favor confirma tu correo electronico antes de iniciar sesion.";
      }
      setError(errorMessage);
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      setError("No se encontro tu perfil. Contacta a tu editor para obtener acceso.");
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    if (profile.role === "client") {
      router.push("/portal/editorial/projects");
      router.refresh();
    } else if (["superadmin", "admin", "sales", "ops"].includes(profile.role)) {
      setError("Esta es el area de clientes. Usa el portal de staff.");
      await supabase.auth.signOut();
      setIsLoading(false);
    } else {
      setError("Rol no valido. Contacta a tu editor.");
      await supabase.auth.signOut();
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los terminos y condiciones.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "client",
          phone: phone || undefined,
          date_of_birth: dateOfBirth || undefined,
        },
        emailRedirectTo: window.location.origin + "/auth/callback?next=/portal/editorial/projects",
      },
    });

    if (signUpError) {
      let errorMessage = signUpError.message;
      if (signUpError.message.includes("already registered")) {
        errorMessage = "Este correo ya esta registrado. Intenta iniciar sesion o recuperar tu contrasena.";
      }
      setError(errorMessage);
      setIsLoading(false);
      return;
    }

    setSuccess("Cuenta creada con exito. Revisa tu correo para confirmar tu cuenta y luego inicia sesion.");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback?next=/portal/editorial/projects",
    });

    if (resetError) {
      setError("Error al enviar el correo de recuperacion. Verifica tu correo e intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    setSuccess("Te enviamos un correo con instrucciones para restablecer tu contrasena. Revisa tu bandeja de entrada.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-white px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a6b]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1a3a6b]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Image
            src="/logo-editorial-reino.png"
            alt="Reino Editorial"
            width={180}
            height={60}
            className="mx-auto mb-4"
            priority
          />
          <p className="text-sm text-gray-500">Portal de Clientes</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-[#1a3a6b]/5 border border-gray-100 p-8">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => switchView("login")}
              className={"flex-1 py-2 text-sm font-medium rounded-lg transition-all " + (view === "login" ? "bg-white text-[#1a3a6b] shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Iniciar sesion
            </button>
            <button
              onClick={() => switchView("register")}
              className={"flex-1 py-2 text-sm font-medium rounded-lg transition-all " + (view === "register" ? "bg-white text-[#1a3a6b] shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Crear cuenta
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
              {success}
            </div>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-gray-600">Correo electronico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="login-email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-gray-600">Contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Tu contrasena" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => switchView("forgot")} className="text-xs text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors">
                  Olvidaste tu contrasena?
                </button>
              </div>
              <Button type="submit" className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ingresando...</>) : "Iniciar sesion"}
              </Button>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-sm font-medium text-gray-600">Nombre completo</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-name" type="text" placeholder="Tu nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm font-medium text-gray-600">Correo electronico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-600">Telefono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-dob" className="text-sm font-medium text-gray-600">Fecha de nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm font-medium text-gray-600">Contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Minimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-sm font-medium text-gray-600">Confirmar contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="reg-confirm" type={showConfirm ? "text" : "password"} placeholder="Repite tu contrasena" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1a3a6b] focus:ring-[#1a3a6b]/20" />
                <span className="text-xs text-gray-500 leading-relaxed">Acepto los <a href="https://editorialreino.com/terminos" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b]/70 hover:text-[#1a3a6b] underline">terminos y condiciones</a> de Reino Editorial</span>
              </label>
              <Button type="submit" className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all" disabled={isLoading || !acceptTerms}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando cuenta...</>) : (<><UserPlus className="w-4 h-4 mr-2" />Crear mi cuenta</>)}
              </Button>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contrasena.</p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-600">Correo electronico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a3a6b]/40" />
                  <Input id="forgot-email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#1a3a6b]/50 focus:ring-[#1a3a6b]/20 h-12 rounded-xl" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 mt-2 bg-gradient-to-r from-[#1a3a6b] to-[#2a5a9b] hover:from-[#2a5a9b] hover:to-[#3a6abf] text-white font-semibold rounded-xl shadow-lg shadow-[#1a3a6b]/20 transition-all" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>) : "Enviar instrucciones"}
              </Button>
              <button type="button" onClick={() => switchView("login")} className="w-full text-sm text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors mt-2">
                Volver a iniciar sesion
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {"Necesitas ayuda? Contacta a tu editor en "}
          <a href="mailto:info@editorialreino.com" className="text-[#1a3a6b]/60 hover:text-[#1a3a6b] transition-colors">info@editorialreino.com</a>
        </p>
        <p className="text-center text-xs text-gray-300 mt-8">
          {"© " + new Date().getFullYear() + " Reino Editorial"}
        </p>
      </div>
    </div>
  );
}
