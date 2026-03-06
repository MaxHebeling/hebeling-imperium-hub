"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "ikingdom",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit form");
      }

      setStatus("success");
      setFormData({ full_name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="w-full bg-background">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-imperium.png"
              alt="Hebeling Imperium"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-lg font-bold tracking-tight text-foreground">Imperium</span>
          </div>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:border-accent hover:text-accent transition-colors"
            >
              Staff Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.jpg"
            alt="Hebeling Imperium Background"
            fill
            className="object-cover"
            priority
          />
          {/* Premium Dark Overlay with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60" />
          {/* Additional Subtle Accent Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 max-w-2xl animate-fade-up">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-1 bg-gradient-to-b from-accent to-accent/40 rounded-full" />
                <span className="text-xs font-semibold tracking-widest text-accent uppercase">
                  Hebeling Imperium Group
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-foreground">
                Arquitectura estratégica para negocios que deciden dominar su presencia digital
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground/90 leading-relaxed max-w-xl">
                Diseñamos ecosistemas digitales, plataformas y activos de marca para empresas, firmas y líderes que operan con visión de crecimiento exponencial.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 h-12 rounded-lg transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  Solicitar evaluación
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/60 hover:border-accent hover:bg-accent/10 text-primary font-semibold text-base px-8 h-12 rounded-lg transition-all"
                >
                  Explorar soluciones
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-border/30 flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-accent rounded-full" />
                  <span>Empresas Fortune 500</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-accent rounded-full" />
                  <span>15+ años experiencia</span>
                </div>
              </div>
            </div>

            {/* Right Form Section */}
            <div className="relative">
              <Card className="border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardContent className="p-8">
                  {status === "success" ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Mensaje enviado</h3>
                      <p className="text-muted-foreground">
                        Gracias por tu interés. Nos pondremos en contacto dentro de 24 horas.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setStatus("idle")}
                      >
                        Enviar otro mensaje
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">Solicitud de evaluación</h3>
                        <p className="text-sm text-muted-foreground">
                          Completa el formulario para recibir una propuesta personalizada.
                        </p>
                      </div>

                      {status === "error" && (
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-destructive">{errorMessage}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-foreground font-medium">
                          Nombre completo *
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Tu nombre"
                          disabled={status === "loading"}
                          className="bg-background/50 border-border/60 placeholder:text-muted-foreground/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="tu@empresa.com"
                          disabled={status === "loading"}
                          className="bg-background/50 border-border/60 placeholder:text-muted-foreground/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground font-medium">
                          Teléfono
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 234 567 8900"
                          disabled={status === "loading"}
                          className="bg-background/50 border-border/60 placeholder:text-muted-foreground/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-foreground font-medium">
                          Tu proyecto
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Cuéntanos brevemente sobre tu proyecto o desafío..."
                          rows={3}
                          disabled={status === "loading"}
                          className="bg-background/50 border-border/60 placeholder:text-muted-foreground/50 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 transition-all hover:shadow-lg hover:shadow-accent/20"
                        disabled={status === "loading"}
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Solicitar evaluación
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Decorative Elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
              <div className="absolute -bottom-24 -right-12 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
