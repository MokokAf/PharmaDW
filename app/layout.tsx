import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'DWA IA Maroc - Plateforme Pharmaceutique Intelligente',
    template: '%s | DWA IA Maroc'
  },
  description: 'Plateforme pharmaceutique intelligente au Maroc avec base de données complète des médicaments, assistant IA pour pharmaciens et espace professionnel.',
  keywords: ['pharmacie', 'médicaments', 'Maroc', 'IA', 'assistant pharmaceutique', 'DCI', 'laboratoire'],
  authors: [{ name: 'DWA IA Maroc' }],
  creator: 'DWA IA Maroc',
  publisher: 'DWA IA Maroc',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://dwa-ia-maroc.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: '/',
    title: 'DWA IA Maroc - Plateforme Pharmaceutique Intelligente',
    description: 'Plateforme pharmaceutique intelligente au Maroc avec base de données complète des médicaments, assistant IA pour pharmaciens et espace professionnel.',
    siteName: 'DWA IA Maroc',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DWA IA Maroc - Plateforme Pharmaceutique Intelligente',
    description: 'Plateforme pharmaceutique intelligente au Maroc avec base de données complète des médicaments, assistant IA pour pharmaciens et espace professionnel.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="your-google-verification-code" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
