import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  email: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ session, user: session.user, profile, loading: false, error: null });
      } else {
        setState({ session: null, user: null, profile: null, loading: false, error: null });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ session, user: session.user, profile, loading: false, error: null });
      } else {
        setState({ session: null, user: null, profile: null, loading: false, error: null });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let errorMessage = error.message;
      if (error.message === "Invalid login credentials") {
        errorMessage = "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Por favor confirma tu correo electrónico antes de iniciar sesión.";
      }
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      return false;
    }

    // Check role
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      if (!profile || profile.role !== "client") {
        await supabase.auth.signOut();
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Esta app es exclusiva para clientes de Reino Editorial.",
        }));
        return false;
      }
    }

    return true;
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, profile: null, loading: false, error: null });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: "Error al enviar el enlace. Verifica tu correo." };
    }
    return { success: true, error: null };
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.session && !!state.profile,
    displayName: state.profile?.full_name ?? state.user?.email?.split("@")[0] ?? "Autor",
    signIn,
    signOut,
    resetPassword,
    clearError,
  };
}
