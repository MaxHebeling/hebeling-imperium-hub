'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  PenTool,
  Layout,
  Printer,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  Star,
  ChevronRight,
  Loader2,
  Users,
  Award,
  Globe,
} from 'lucide-react';
import { trackEvent } from '@/components/tracking/google-analytics';
import { trackMetaEvent } from '@/components/tracking/meta-pixel';

interface LeadFormData {
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  manuscript_type: string;
  message: string;
}

const SERVICES = [
  {
    icon: PenTool,
    title: 'Corrección de manuscritos',
    description: 'Corrección ortográfica, gramatical y de estilo para que tu texto brille con profesionalismo.',
  },
  {
    icon: BookOpen,
    title: 'Edición editorial',
    description: 'Edición estructural y de contenido que transforma tu manuscrito en una obra publicable.',
  },
  {
    icon: Layout,
    title: 'Diseño y maquetación',
    description: 'Diseño interior profesional y maquetación lista para impresión o distribución digital.',
  },
  {
    icon: Printer,
    title: 'Publicación completa',
    description: 'Acompañamiento integral desde el manuscrito hasta el libro impreso y digital.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Pastor Roberto M.',
    country: 'México',
    text: 'Reino Editorial transformó mi manuscrito en un libro profesional. El proceso fue claro y el resultado superó mis expectativas.',
  },
  {
    name: 'María Elena G.',
    country: 'Colombia',
    text: 'Excelente servicio editorial. Me acompañaron en cada etapa y mi libro quedó hermoso.',
  },
  {
    name: 'Carlos A.',
    country: 'España',
    text: 'Profesionalismo de primer nivel. Recomiendo Reino Editorial a cualquier autor que quiera publicar.',
  },
];

const COUNTRIES = [
  'México',
  'Estados Unidos',
  'Colombia',
  'Argentina',
  'España',
  'Chile',
  'Perú',
  'Ecuador',
  'Guatemala',
  'Honduras',
  'El Salvador',
  'Costa Rica',
  'Panamá',
  'República Dominicana',
  'Venezuela',
  'Bolivia',
  'Paraguay',
  'Uruguay',
  'Puerto Rico',
  'Otro',
];

const MANUSCRIPT_TYPES = [
  'Libro cristiano / devocional',
  'Manual de discipulado',
  'Teología / estudio bíblico',
  'Testimonio / biografía',
  'Liderazgo / ministerio',
  'Novela / ficción',
  'Poesía',
  'Libro infantil',
  'Material educativo',
  'Otro',
];

export default function PublicaTuLibroPage() {
  const [formData, setFormData] = useState<LeadFormData>({
    full_name: '',
    email: '',
    whatsapp: '',
    country: '',
    manuscript_type: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/editorial/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          country: formData.country,
          project_description: formData.message,
          main_service: formData.manuscript_type,
          source: 'campaign_landing',
          brand: 'editorial-reino',
          origin_page: '/publica-tu-libro',
          form_type: 'publica_tu_libro',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Error al enviar. Inténtalo de nuevo.');
        setIsSubmitting(false);
        return;
      }

      // Track conversions
      trackEvent('form_submit', {
        form_name: 'publica_tu_libro',
        lead_source: 'campaign_landing',
      });
      trackEvent('lead', {
        currency: 'USD',
        value: 0,
      });
      trackMetaEvent('Lead', {
        content_name: 'publica-tu-libro',
        content_category: 'editorial',
      });

      setSuccess(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleCtaClick = (ctaName: string) => {
    trackEvent('button_click', { button_name: ctaName, page: 'publica-tu-libro' });
    trackMetaEvent('Contact', { content_name: ctaName });
  };

  if (success) {
    return (
      <div className="editorial-theme min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-[var(--re-border)]">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--re-success-pale)] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--re-success)]" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[var(--re-text)]">
            ¡Solicitud recibida!
          </h2>
          <p className="text-[var(--re-text-muted)]">
            Gracias por tu interés en publicar con Reino Editorial. Nuestro equipo revisará
            tu solicitud y te contactaremos en menos de 48 horas.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[var(--re-blue)] hover:underline font-medium"
            >
              Volver al inicio
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-theme min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--re-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/reino-logo.png" alt="Reino Editorial" width={40} height={40} className="h-10 w-auto" />
            <span className="font-serif text-lg font-bold text-[var(--re-text)] hidden sm:block">
              Reino Editorial
            </span>
          </Link>
          <a
            href="#formulario"
            onClick={() => handleCtaClick('nav_cta')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--re-blue)] text-white rounded-full text-sm font-semibold hover:bg-[var(--re-blue-deep)] transition-colors"
          >
            Evaluar mi manuscrito
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-b from-[var(--re-blue-pale)] to-[var(--re-bg)]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="uppercase tracking-[0.25em] text-sm font-semibold text-[var(--re-blue)]">
            Acompañamiento Editorial Profesional
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--re-text)] leading-tight">
            Convierte tu manuscrito en un{' '}
            <span className="text-[var(--re-blue)]">libro profesional</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--re-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Acompañamos a autores, ministerios y organizaciones a transformar sus ideas en
            libros publicados con estándares editoriales profesionales.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--re-text-muted)]">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--re-success)]" />
              Sin compromiso
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--re-blue)]" />
              Respuesta en 48 horas
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--re-gold)]" />
              Evaluación profesional
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#formulario"
              onClick={() => handleCtaClick('hero_cta')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--re-blue)] text-white rounded-full text-base font-bold hover:bg-[var(--re-blue-deep)] transition-all hover:shadow-lg hover:scale-105"
            >
              <Send className="w-5 h-5" />
              Evaluar mi manuscrito
            </a>
            <a
              href="#servicios"
              onClick={() => handleCtaClick('hero_services')}
              className="inline-flex items-center gap-2 text-[var(--re-blue)] font-medium hover:underline"
            >
              Explorar servicios
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y border-[var(--re-border)] bg-white">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Users className="w-6 h-6 text-[var(--re-blue)]" />
            <span className="font-bold text-xl text-[var(--re-text)]">+30</span>
            <span className="text-xs text-[var(--re-text-muted)]">Autores publicados</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Globe className="w-6 h-6 text-[var(--re-blue)]" />
            <span className="font-bold text-xl text-[var(--re-text)]">5+</span>
            <span className="text-xs text-[var(--re-text-muted)]">Países</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Award className="w-6 h-6 text-[var(--re-blue)]" />
            <span className="font-bold text-xl text-[var(--re-text)]">100%</span>
            <span className="text-xs text-[var(--re-text-muted)]">Profesional</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="w-6 h-6 text-[var(--re-gold)]" />
            <span className="font-bold text-xl text-[var(--re-text)]">5.0</span>
            <span className="text-xs text-[var(--re-text-muted)]">Satisfacción</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold text-[var(--re-blue)] mb-4">
              Nuestros servicios
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--re-text)]">
              De manuscrito a libro publicado
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="p-6 bg-white rounded-2xl border border-[var(--re-border)] hover:border-[var(--re-blue)]/30 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--re-blue-pale)] flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-[var(--re-blue)]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[var(--re-text)] mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-[var(--re-text-muted)] leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 bg-[var(--re-surface-2)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold text-[var(--re-blue)] mb-4">
              Proceso editorial
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--re-text)]">
              ¿Cómo funciona?
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Envía tu manuscrito',
                desc: 'Completa el formulario con tus datos y cuéntanos sobre tu proyecto. Es gratis y sin compromiso.',
              },
              {
                step: '02',
                title: 'Evaluación editorial',
                desc: 'Nuestro equipo revisará tu manuscrito y te enviará una evaluación profesional con recomendaciones.',
              },
              {
                step: '03',
                title: 'Propuesta personalizada',
                desc: 'Recibirás una propuesta adaptada a tus necesidades: corrección, edición, diseño o publicación completa.',
              },
              {
                step: '04',
                title: 'Publicación profesional',
                desc: 'Trabajamos contigo en cada etapa hasta tener tu libro listo para impresión y distribución.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 items-start p-6 bg-white rounded-2xl border border-[var(--re-border)]"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--re-blue)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[var(--re-text)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--re-text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold text-[var(--re-blue)] mb-4">
              Testimonios
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--re-text)]">
              Lo que dicen nuestros autores
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6 bg-white rounded-2xl border border-[var(--re-border)] space-y-4"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[var(--re-gold)] text-[var(--re-gold)]" />
                  ))}
                </div>
                <p className="text-sm text-[var(--re-text-muted)] leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm text-[var(--re-text)]">{t.name}</p>
                  <p className="text-xs text-[var(--re-text-subtle)]">{t.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form */}
      <section id="formulario" className="py-20 px-4 bg-gradient-to-b from-[var(--re-bg)] to-[var(--re-blue-pale)]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="uppercase tracking-[0.2em] text-sm font-semibold text-[var(--re-blue)] mb-4">
              Comienza hoy
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--re-text)]">
              Evalúa tu manuscrito gratis
            </h2>
            <p className="text-[var(--re-text-muted)] mt-3">
              Completa el formulario y recibirás una evaluación profesional sin compromiso.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[var(--re-border)] p-8 shadow-lg space-y-5"
          >
            {/* Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                Nombre completo *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] placeholder:text-[var(--re-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                Correo electrónico *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] placeholder:text-[var(--re-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                WhatsApp (con código de país)
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+52 55 1234 5678"
                className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] placeholder:text-[var(--re-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors"
              />
            </div>

            {/* Country + Manuscript Type row */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                  País *
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors"
                >
                  <option value="">Selecciona</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="manuscript_type" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                  Tipo de manuscrito
                </label>
                <select
                  id="manuscript_type"
                  name="manuscript_type"
                  value={formData.manuscript_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors"
                >
                  <option value="">Selecciona</option>
                  {MANUSCRIPT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[var(--re-text)] mb-1.5">
                Cuéntanos sobre tu proyecto
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe brevemente tu manuscrito, en qué etapa está y qué servicio te interesa..."
                className="w-full px-4 py-3 rounded-lg border border-[var(--re-border)] bg-[var(--re-surface)] text-[var(--re-text)] placeholder:text-[var(--re-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--re-blue)]/30 focus:border-[var(--re-blue)] transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--re-danger-pale)] text-[var(--re-danger)] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[var(--re-blue)] text-white rounded-full text-base font-bold hover:bg-[var(--re-blue-deep)] transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar solicitud
                </>
              )}
            </button>

            <p className="text-xs text-center text-[var(--re-text-subtle)]">
              Al enviar aceptas nuestra{' '}
              <Link href="/privacidad" className="underline hover:text-[var(--re-blue)]">
                política de privacidad
              </Link>
              . Evaluación gratuita y sin compromiso.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[var(--re-text)] text-white/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm">
            Copyright © {new Date().getFullYear()} Reino Editorial | Hecho por{' '}
            <a
              href="https://www.ikingdom.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-[var(--re-gold)] transition-colors"
            >
              iKingdom
            </a>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/terminos" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
