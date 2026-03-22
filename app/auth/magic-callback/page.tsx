"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side callback page for magic link implicit flow.
 *
 * When signInWithOtp is called server-side with flowType "implicit",
 * Supabase redirects here with tokens in the URL hash fragment
 * (e.g. #access_token=...&refresh_token=...).
 *
 * This page reads the hash, establishes the session in the browser,
 * and redirects the user to the portal.
 */
function MagicCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/portal/editorial/projects";
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();

        // The implicit flow puts tokens in the URL hash fragment.
        // Supabase JS client auto-detects them via onAuthStateChange,
        // but we can also check explicitly.
        const hash = window.location.hash;

        if (hash && hash.includes("access_token")) {
          // Let the Supabase client process the hash tokens.
          // onAuthStateChange will fire and set session cookies via the SSR helper.
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }

          if (data.session) {
            router.replace(next);
            return;
          }
        }

        // If no hash tokens, wait a moment for Supabase to process them
        // (the client auto-detects hash on initialization)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(next);
          return;
        }

        // Still no session - show error
        setStatus("error");
        setErrorMsg(
          "No se pudo establecer la sesión. El enlace puede haber expirado."
        );
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Error procesando el enlace"
        );
      }
    }

    handleCallback();
  }, [next, router]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">
            Error de autenticación
          </h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <a
            href="/client-login"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">
          Verificando tu acceso...
        </p>
      </div>
    </div>
  );
}

export default function MagicCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <MagicCallbackContent />
    </Suspense>
  );
}
