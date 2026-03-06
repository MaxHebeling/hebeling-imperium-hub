"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();
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
      
      console.log("[v0] Attempting login with email:", email);
      console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error("[v0] Auth error:", JSON.stringify(signInError, null, 2));
      // Show the actual error message from Supabase
      setError(`Auth error: ${signInError.message} (code: ${signInError.status || 'unknown'})`);
      setIsLoading(false);
      return;
    }
    
    console.log("[v0] Auth successful, user ID:", authData.user?.id);
    
    // Fetch profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();
    
    console.log("[v0] Profile fetch result:", { profile, profileError });
    
    if (profileError || !profile) {
      console.error("[v0] Profile error:", profileError);
      setError(`Profile not found for user ${authData.user.email}. Contact administrator.`);
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }
    
    // Redirect based on role
    if (profile.role === "superadmin" || profile.role === "admin" || profile.role === "sales" || profile.role === "ops") {
      router.push("/app/dashboard");
      router.refresh();
    } else if (profile.role === "client") {
      // Clients should use client-login
      setError("Please use the client portal to sign in.");
      await supabase.auth.signOut();
      setIsLoading(false);
    } else {
      setError("Invalid role. Contact administrator.");
      await supabase.auth.signOut();
      setIsLoading(false);
    }
    } catch (err: unknown) {
      console.error("[v0] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Unexpected error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Hebeling Imperium"
              width={100}
              height={100}
              className="rounded-full"
              priority
            />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t.login.title}
          </h1>
          <p className="text-muted-foreground mt-2">{t.login.subtitle}</p>
        </div>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-medium">{t.login.signIn}</CardTitle>
            <CardDescription>
              {t.login.emailPlaceholder}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {t.login.errorTitle}: {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t.login.emailLabel}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t.login.passwordLabel}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? t.login.signingIn : t.login.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <LanguageProvider>
      <LoginForm />
    </LanguageProvider>
  );
}
