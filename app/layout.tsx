import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider } from '@/lib/i18n'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/tracking/google-tag-manager'
import { GoogleAnalytics } from '@/components/tracking/google-analytics'
import { MetaPixel } from '@/components/tracking/meta-pixel'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: 'Hebeling OS | Enterprise Operating System',
  description: 'Premium enterprise operating system for Hebeling Imperium Group',
}

export const viewport: Viewport = {
  themeColor: '#0B1420',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="facebook-domain-verification" content="hcz89foxj2tw19osjlonjey79sq7vb" />
        <GoogleTagManager />
        <GoogleAnalytics />
        <MetaPixel />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <GoogleTagManagerNoScript />
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
