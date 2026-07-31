import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Promociones Exclusivas – COSAE 2026',
  description: 'Ofertas exclusivas de Dental Medrano en la COSAE 2026. Materiales dentales, endodoncia, dique de goma y más.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Promociones Exclusivas – COSAE 2026',
    description: 'Ofertas exclusivas de Dental Medrano en la COSAE 2026. ¡Aprovechá los descuentos!',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Promociones COSAE 2026 - Dental Medrano' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promociones Exclusivas – COSAE 2026',
    description: 'Ofertas exclusivas de Dental Medrano en la COSAE 2026.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Barlow', sans-serif" }} className="bg-[#f5f5f5]">
        {children}
      </body>
    </html>
  )
}
