import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

// Fuente Display - Títulos elegantes
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// Fuente Body - Texto general
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'Chic Import USA - Productos Importados Premium',
    template: '%s | Chic Import USA',
  },
  description: 'Marketplace de productos importados premium. Encuentra calzado, ropa, tecnología y más con la mejor calidad y precios.',
  keywords: ['importados', 'productos', 'marketplace', 'premium', 'USA', 'Colombia'],
  authors: [{ name: 'Chic Import USA' }],
  creator: 'Chic Import USA',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://pwa-import-marketplace.vercel.app',
    siteName: 'Chic Import USA',
    title: 'Chic Import USA - Productos Importados Premium',
    description: 'Marketplace de productos importados premium.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Chic Import USA',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chic Import USA',
    description: 'Marketplace de productos importados premium.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#D4AF37',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D4AF37',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cormorantGaramond.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}