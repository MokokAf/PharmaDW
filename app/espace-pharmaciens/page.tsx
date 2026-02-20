import type { Metadata } from 'next'
import EspacePharmaciensClient from './EspacePharmaciensClient'
import { absoluteUrl, pageAlternates } from '@/lib/seo'

const title = 'Espace pharmaciens - Assistant DwaIA pour interactions medicamenteuses'
const description =
  'Espace professionnel PharmaDW pour pharmaciens: verification d interactions medicamenteuses avec contexte patient, triage et support clinique.'

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates('/espace-pharmaciens'),
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'fr_MA',
    url: absoluteUrl('/espace-pharmaciens'),
    images: [absoluteUrl('/opengraph-image')],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function EspacePharmaciensPage() {
  return <EspacePharmaciensClient />
}
