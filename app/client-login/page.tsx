"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    console.log("[v0] Attempting client login with email:", email);
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error("[v0] Auth error:", signInError.message, signInError.status, signInError);
      // Show more detailed error message
      let errorMessage = signInError.message;
      if (signInError.message === "Invalid login credentials") {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (signInError.message.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email address before signing in.";
      }
      setError(errorMessage);
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
      setError(`Profile not found for user ${authData.user.email}. Contact your account manager.`);
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }
    
    // Redirect based on role
    if (profile.role === "client") {
      router.push("/portal/overview");
      router.refresh();
    } else if (profile.role === "superadmin" || profile.role === "admin" || profile.role === "sales" || profile.role === "ops") {
      // Staff should use staff login
      setError("Please use the staff portal to sign in.");
      await supabase.auth.signOut();
      setIsLoading(false);
    } else {
      setError("Invalid role. Contact your account manager.");
      await supabase.auth.signOut();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Hebeling Imperium
          </h1>
          <p className="text-muted-foreground mt-2">Client Portal</p>
        </div>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-medium">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to view your projects and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
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
                {isLoading ? "Signing in..." : "Access Portal"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need access? Contact your account manager.
        </p>
      </div>
    </div>
  );
}
