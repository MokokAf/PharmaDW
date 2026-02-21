import { Suspense } from 'react'
import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import MedicamentsContent from './MedicamentsContent'
import { absoluteUrl, pageAlternates } from '@/lib/seo'
import type { MedDrugListItem } from '@/types/medication'

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

// Pre-load first 30 drugs server-side so Googlebot sees real links, not a skeleton
async function getInitialDrugs(): Promise<MedDrugListItem[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'public/data/medicament_list_index.json'),
      'utf8'
    )
    const all = JSON.parse(raw) as MedDrugListItem[]
    const seen = new Set<string>()
    return all
      .filter((d) => {
        if (seen.has(d.name)) return false
        seen.add(d.name)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 30)
  } catch {
    return []
  }
}

export default async function MedicamentsPage() {
  const initialDrugs = await getInitialDrugs()

  return (
    <>
      {/* SSR links for Googlebot — visible in source HTML, hidden visually once JS hydrates */}
      <div className="sr-only" aria-hidden="true">
        {initialDrugs.map((drug) => (
          <Link key={drug.id} href={`/medicaments/${drug.id}`} tabIndex={-1}>
            {drug.name}
            {drug.manufacturer && drug.manufacturer !== 'NON RENSEIGNÉ' ? ` - ${drug.manufacturer}` : ''}
          </Link>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto px-4 py-8 text-sm text-muted-foreground">
            Chargement des medicaments...
          </div>
        }
      >
        <MedicamentsContent />
      </Suspense>
    </>
  )
}
