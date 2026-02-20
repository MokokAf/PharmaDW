import type { Metadata } from 'next'
import PharmacistDashboardClient from './PharmacistDashboardClient'
import { absoluteUrl, pageAlternates } from '@/lib/seo'

const title = 'Tableau de bord pharmacien - DwaIA'
const description =
  'Tableau de bord pharmacien avec assistant d interactions medicamenteuses, contexte patient, triage vert/ambre/rouge et historique de verification.'

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates('/espace-pharmaciens/dashboard'),
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'fr_MA',
    url: absoluteUrl('/espace-pharmaciens/dashboard'),
    images: [absoluteUrl('/opengraph-image')],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function PharmacistDashboardPage() {
  return <PharmacistDashboardClient />
}
