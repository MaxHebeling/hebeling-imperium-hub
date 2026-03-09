"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function LogoBlock({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center min-h-12 items-center ${className ?? ""}`}>
      <img
        src="/assets/ikingdom-logo.svg"
        alt="iKingdom"
        className="h-12 w-auto object-contain"
      />
    </div>
  )
}

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const data = {
      full_name: formData.get("full_name"),
      company: formData.get("company"),
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp"),
      project_description: formData.get("project_description"),
    }

    try {
      const res = await fetch("/api/external/ikingdom-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json?.error ?? "Error al enviar. Intenta de nuevo.")
        return
      }
      setSuccess(true)
    } catch (error) {
      console.error(error)
      alert("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F7F5] flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <LogoBlock className="mb-14" />
          <p className="text-[#1a1a1a] text-xl font-light tracking-tight leading-snug">
            Gracias por enviar tu solicitud.
          </p>
          <p className="mt-5 text-[#5c5c5c] text-[15px] leading-relaxed max-w-sm mx-auto">
            Nuestro equipo revisará tu proyecto y nos pondremos en contacto contigo.
          </p>
          <p className="mt-16 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
            ikingdom.org
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Header elegante */}
      <header className="flex shrink-0 flex-col items-center justify-center pt-12 pb-8 px-6">
        <LogoBlock className="mb-12" />
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a8a8a] font-medium">
            Solicitud de proyecto
          </p>
        </div>
      </header>

      {/* Card principal premium */}
      <main className="flex-1 flex items-start justify-center px-6 pb-20 pt-4">
        <div className="w-full max-w-[420px]">
          <div
            className="rounded-2xl border border-[#e8e6e3] bg-white/80 backdrop-blur-sm p-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            <form onSubmit={handleSubmit} className="space-y-0">
              {/* Sección: Contacto */}
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a] font-medium">
                  Contacto
                </p>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="full_name" className="sr-only">
                      Nombre completo
                    </label>
                    <Input
                      id="full_name"
                      name="full_name"
                      placeholder="Nombre completo"
                      required
                      className="h-12 rounded-lg border-[#e8e6e3] bg-white text-[#1a1a1a] placeholder:text-[#a3a3a3] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="sr-only">
                      Empresa
                    </label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Empresa"
                      className="h-12 rounded-lg border-[#e8e6e3] bg-white text-[#1a1a1a] placeholder:text-[#a3a3a3] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      required
                      className="h-12 rounded-lg border-[#e8e6e3] bg-white text-[#1a1a1a] placeholder:text-[#a3a3a3] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="whatsapp" className="sr-only">
                      WhatsApp
                    </label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      placeholder="WhatsApp"
                      className="h-12 rounded-lg border-[#e8e6e3] bg-white text-[#1a1a1a] placeholder:text-[#a3a3a3] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Proyecto */}
              <div className="mt-10 pt-10 space-y-6 border-t border-[#e8e6e3]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a] font-medium">
                  Proyecto
                </p>
                <div>
                  <label htmlFor="project_description" className="sr-only">
                    Describe tu proyecto
                  </label>
                  <Textarea
                    id="project_description"
                    name="project_description"
                    placeholder="Describe tu proyecto o idea en pocas líneas."
                    required
                    rows={5}
                    className="min-h-[120px] rounded-lg border-[#e8e6e3] bg-white text-[#1a1a1a] placeholder:text-[#a3a3a3] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Submit premium */}
              <div className="mt-10 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-lg bg-[#1a1a1a] text-white text-sm font-medium tracking-wide transition-all hover:bg-[#2d2d2d] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando…" : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
