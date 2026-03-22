"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function StaffMagicCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/app/companies";
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();
        const hash = window.location.hash;

        if (hash && hash.includes("access_token")) {
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

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(next);
          return;
        }

        setStatus("error");
        setErrorMsg(
          "No se pudo establecer la sesion. El enlace puede haber expirado."
        );
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error instanceof Error ? error.message : "Error procesando el enlace"
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
            Error de autenticacion
          </h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Ir al acceso del equipo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Verificando tu acceso...</p>
      </div>
    </div>
  );
}

export default function StaffMagicCallbackPage() {
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
      <StaffMagicCallbackContent />
    </Suspense>
  );
}
