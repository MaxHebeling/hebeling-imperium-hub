"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Smartphone, Download, Globe, MessageSquare, HelpCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
type Locale = "es" | "en";

const T = {
  es: {
    back: "Mis libros",
    title: "Ayuda",
    subtitle: "Guia para usar el portal de Reino Editorial",
    installTitle: "Como instalar la app en tu celular",
    installDesc: "Sigue estos pasos para tener la app en tu pantalla de inicio, como cualquier otra aplicacion.",
    androidTitle: "Android (Samsung, Xiaomi, Motorola, etc.)",
    androidSteps: [
      "Abre Google Chrome en tu celular.",
      "Escribe la direccion del portal en la barra de arriba.",
      "Ingresa tu correo y contrasena.",
      "Toca los tres puntitos (menu) arriba a la derecha.",
      'Busca "Instalar app" o "Agregar a pantalla de inicio".',
      'Dale "Instalar" y listo.',
    ],
    iphoneTitle: "iPhone",
    iphoneSteps: [
      "Abre Safari (la brujula azul). Debe ser Safari, no Chrome.",
      "Escribe la direccion del portal en la barra de arriba.",
      "Ingresa tu correo y contrasena.",
      "Toca el boton de compartir (cuadrito con flecha hacia arriba) abajo en el centro.",
      'Busca "Agregar a pantalla de inicio".',
      'Dale "Agregar" y listo.',
    ],
    portalTitle: "Como usar el portal",
    portalFeatures: [
      {
        icon: "books",
        title: "Mis Libros",
        desc: "Aqui ves todos tus proyectos editoriales y el progreso de cada uno.",
      },
      {
        icon: "stages",
        title: "Etapas del proceso",
        desc: "Tu libro pasa por 8 etapas profesionales. Veras el avance conforme el equipo editorial trabaja.",
      },
      {
        icon: "comments",
        title: "Comentarios",
        desc: "Puedes escribir comentarios o preguntas y el equipo editorial te respondera.",
      },
      {
        icon: "upload",
        title: "Subir archivos",
        desc: "Si necesitas enviar una nueva version de tu manuscrito, usa el boton 'Seleccionar archivo'.",
      },
      {
        icon: "language",
        title: "Idioma",
        desc: "Puedes cambiar entre Espanol e Ingles con el boton del globo arriba a la derecha.",
      },
    ],
    faqTitle: "Preguntas frecuentes",
    faqs: [
      {
        q: "No me aparece 'Instalar app' en Android",
        a: "Asegurate de estar usando Google Chrome. Si no aparece, toca los tres puntitos y busca 'Agregar a pantalla de inicio'.",
      },
      {
        q: "No me aparece 'Agregar a pantalla de inicio' en iPhone",
        a: "Asegurate de estar usando Safari (no Chrome). El boton de compartir es el cuadrito con flecha hacia arriba.",
      },
      {
        q: "Se me olvido mi contrasena",
        a: "Contacta a tu editor en info@editorialreino.com para que te la restablezcan.",
      },
      {
        q: "Cuanto tiempo tarda el proceso editorial?",
        a: "El proceso completo toma aproximadamente 12 dias. Veras el avance de cada etapa en tu portal.",
      },
    ],
    contactTitle: "Necesitas mas ayuda?",
    contactDesc: "Escribe a tu editor:",
    contactEmail: "info@editorialreino.com",
  },
  en: {
    back: "My books",
    title: "Help",
    subtitle: "Guide to using the Reino Editorial portal",
    installTitle: "How to install the app on your phone",
    installDesc: "Follow these steps to add the app to your home screen, just like any other app.",
    androidTitle: "Android (Samsung, Xiaomi, Motorola, etc.)",
    androidSteps: [
      "Open Google Chrome on your phone.",
      "Type the portal address in the bar at the top.",
      "Enter your email and password.",
      "Tap the three dots (menu) at the top right.",
      'Look for "Install app" or "Add to Home screen".',
      'Tap "Install" and you\'re done.',
    ],
    iphoneTitle: "iPhone",
    iphoneSteps: [
      "Open Safari (the blue compass icon). It must be Safari, not Chrome.",
      "Type the portal address in the bar at the top.",
      "Enter your email and password.",
      "Tap the share button (square with arrow pointing up) at the bottom center.",
      'Look for "Add to Home Screen".',
      'Tap "Add" and you\'re done.',
    ],
    portalTitle: "How to use the portal",
    portalFeatures: [
      {
        icon: "books",
        title: "My Books",
        desc: "Here you can see all your editorial projects and the progress of each one.",
      },
      {
        icon: "stages",
        title: "Process stages",
        desc: "Your book goes through 8 professional stages. You'll see progress as the editorial team works.",
      },
      {
        icon: "comments",
        title: "Comments",
        desc: "You can write comments or questions and the editorial team will respond.",
      },
      {
        icon: "upload",
        title: "Upload files",
        desc: "If you need to send a new version of your manuscript, use the 'Select file' button.",
      },
      {
        icon: "language",
        title: "Language",
        desc: "You can switch between Spanish and English with the globe button at the top right.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        q: "I don't see 'Install app' on Android",
        a: "Make sure you're using Google Chrome. If it doesn't appear, tap the three dots and look for 'Add to Home screen'.",
      },
      {
        q: "I don't see 'Add to Home Screen' on iPhone",
        a: "Make sure you're using Safari (not Chrome). The share button is the square with an arrow pointing up.",
      },
      {
        q: "I forgot my password",
        a: "Contact your editor at info@editorialreino.com to reset it.",
      },
      {
        q: "How long does the editorial process take?",
        a: "The full process takes approximately 12 days. You'll see the progress of each stage in your portal.",
      },
    ],
    contactTitle: "Need more help?",
    contactDesc: "Write to your editor:",
    contactEmail: "info@editorialreino.com",
  },
};

export default function PortalHelpPage() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "es";
    const saved = localStorage.getItem("reino-locale");
    return saved === "es" || saved === "en" ? saved : "es";
  });

  const t = T[locale];

  const toggleLocale = () => {
    const next = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("reino-locale", next);
    window.dispatchEvent(new Event("reino-locale-change"));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/editorial/projects"
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-[#1a3a6b]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-400">{t.subtitle}</p>
        </div>
      </div>

      {/* Install section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-[#1a3a6b]" />
          <h2 className="text-base font-bold text-gray-900">{t.installTitle}</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">{t.installDesc}</p>

        {/* Android */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-600">A</span>
            {t.androidTitle}
          </h3>
          <ol className="space-y-2 ml-7">
            {t.androidSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#1a3a6b]/10 flex items-center justify-center text-[10px] font-bold text-[#1a3a6b] mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* iPhone */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">i</span>
            {t.iphoneTitle}
          </h3>
          <ol className="space-y-2 ml-7">
            {t.iphoneSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#1a3a6b]/10 flex items-center justify-center text-[10px] font-bold text-[#1a3a6b] mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Portal features */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">{t.portalTitle}</h2>
        <div className="space-y-3">
          {t.portalFeatures.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
                {feature.icon === "comments" ? (
                  <MessageSquare className="w-4 h-4 text-[#1a3a6b]" />
                ) : feature.icon === "language" ? (
                  <Globe className="w-4 h-4 text-[#1a3a6b]" />
                ) : (
                  <Download className="w-4 h-4 text-[#1a3a6b]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{feature.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">{t.faqTitle}</h2>
        <div className="space-y-3">
          {t.faqs.map((faq, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50">
              <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-[#1a3a6b]/10 bg-[#1a3a6b]/5 p-5 text-center">
        <p className="text-sm font-semibold text-gray-800">{t.contactTitle}</p>
        <p className="text-xs text-gray-500 mt-1">{t.contactDesc}</p>
        <a
          href={`mailto:${t.contactEmail}`}
          className="inline-block mt-2 text-sm font-medium text-[#1a3a6b] hover:underline"
        >
          {t.contactEmail}
        </a>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-300 text-center pb-4">
        &copy; {new Date().getFullYear()} Reino Editorial
      </p>
    </div>
  );
}
