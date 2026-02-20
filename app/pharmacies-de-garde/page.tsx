import type { Metadata } from 'next'
import PharmaciesDeGardeContent from './PharmaciesDeGardeContent'
import { absoluteUrl, pageAlternates } from '@/lib/seo'

const title = 'Pharmacies de garde au Maroc par ville'
const description =
  'Consultez les pharmacies de garde aujourd hui par ville au Maroc: Casablanca, Rabat, Fes, Marrakech, Tanger, Agadir, Meknes et plus.'

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates('/pharmacies-de-garde'),
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'fr_MA',
    url: absoluteUrl('/pharmacies-de-garde'),
    images: [absoluteUrl('/opengraph-image')],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function PharmaciesDeGardePage() {
  return <PharmaciesDeGardeContent />
}
