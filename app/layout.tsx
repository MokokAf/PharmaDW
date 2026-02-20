import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import BottomNav from '@/components/BottomNav'
import { Providers } from './providers'
import {
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_PRIMARY_COLOR,
  SITE_TITLE,
  absoluteUrl,
  getSiteUrl,
  pageAlternates,
} from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: '%s | PharmaDW',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'pharmacie maroc',
    'medicaments maroc',
    'pharmacies de garde',
    'interaction medicamenteuse',
    'dci maroc',
    'prix medicament maroc',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: '/site.webmanifest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: pageAlternates('/'),
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icons/icon-192.svg'],
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: absoluteUrl('/'),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: absoluteUrl('/opengraph-image'),
        width: 1200,
        height: 630,
        alt: 'PharmaDW',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl('/opengraph-image')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'AfKCpIjaAz-ge5pqNfG-yq0sgZ2KkDtHsxxRy31fDt0',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE_PRIMARY_COLOR,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.perplexity.ai" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.perplexity.ai" />
        <link rel="alternate" hrefLang={SITE_LANGUAGE} href={absoluteUrl('/')} />
      </head>
      <body className={`${inter.className} pb-safe md:pb-0`}>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <SiteHeader />
        <Providers>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </Providers>
        <BottomNav />
      </body>
    </html>
  )
}
