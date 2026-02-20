import { Suspense } from 'react'
import type { Metadata } from 'next'
import MedicamentsContent from './MedicamentsContent'
import { absoluteUrl, pageAlternates } from '@/lib/seo'

const title = 'Base des medicaments au Maroc (DCI, prix, laboratoire)'
const description =
  'Consultez plus de 5 000 fiches medicaments au Maroc avec recherche par nom, DCI, laboratoire, classe therapeutique et lettre alphabetique.'

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates('/medicaments'),
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'fr_MA',
    url: absoluteUrl('/medicaments'),
    images: [absoluteUrl('/opengraph-image')],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function MedicamentsPage() {
  return (
    <Suspense
      fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-sm text-muted-foreground">Chargement des medicaments...</div>}
    >
      <MedicamentsContent />
    </Suspense>
  )
}
