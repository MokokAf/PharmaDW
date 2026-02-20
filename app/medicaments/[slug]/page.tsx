import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import FicheMedicament from '@/components/FicheMedicament'
import type { MedDrug } from '@/types/medication'
import { absoluteUrl, pageAlternates } from '@/lib/seo'

const dataPath = path.join(process.cwd(), 'public/data/medicament_ma_optimized.json')

export const revalidate = 60 * 60 * 24
export const dynamicParams = true

type RouteParams = {
  params: {
    slug: string
  }
}

let drugsPromise: Promise<MedDrug[]> | null = null

async function getAllDrugs(): Promise<MedDrug[]> {
  if (!drugsPromise) {
    drugsPromise = fs
      .readFile(dataPath, 'utf8')
      .then((raw) => JSON.parse(raw) as MedDrug[])
      .catch(() => [])
  }

  return drugsPromise
}

function stripMarkdown(input?: string): string | undefined {
  if (!input) {
    return undefined
  }

  return input
    .replace(/[#*_`>\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildDescription(drug: MedDrug): string {
  const dci = drug.activeIngredient?.filter(Boolean).join(', ')
  const details = [drug.strength, drug.dosageForm, drug.manufacturer].filter(Boolean).join(' - ')

  const priceText =
    typeof drug.price?.public === 'number'
      ? `Prix public: ${drug.price.public} ${drug.price.currency ?? 'MAD'}.`
      : ''

  return [
    `${drug.name}${dci ? ` (${dci})` : ''}.`,
    details,
    priceText,
    'Fiche medicament Maroc sur PharmaDW.',
  ]
    .filter(Boolean)
    .join(' ')
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const drugs = await getAllDrugs()
  const drug = drugs.find((item) => item.id.toString() === params.slug)

  if (!drug) {
    return {
      title: 'Medicament introuvable',
      description: 'Cette fiche medicament est introuvable.',
      robots: {
        index: false,
        follow: false,
      },
      alternates: pageAlternates('/medicaments'),
    }
  }

  const title = `${drug.name} - fiche medicament Maroc`
  const description = buildDescription(drug)
  const routePath = `/medicaments/${drug.id}`

  return {
    title,
    description,
    alternates: pageAlternates(routePath),
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'fr_MA',
      url: absoluteUrl(routePath),
      images: [absoluteUrl('/opengraph-image')],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/opengraph-image')],
    },
  }
}

export default async function DrugDetailPage({ params }: RouteParams) {
  const drugs = await getAllDrugs()
  const drug = drugs.find((item) => item.id.toString() === params.slug)
  if (!drug) {
    notFound()
  }

  const routePath = `/medicaments/${drug.id}`
  const drugSchema = {
    '@context': 'https://schema.org',
    '@type': drug['@type'] === 'MedicalDevice' ? 'MedicalDevice' : 'Drug',
    name: drug.name,
    url: absoluteUrl(routePath),
    description: stripMarkdown(drug.description) ?? buildDescription(drug),
    activeIngredient: drug.activeIngredient?.join(', ') || undefined,
    dosageForm: drug.dosageForm,
    code: drug.atcCode,
    manufacturer: drug.manufacturer
      ? {
          '@type': 'Organization',
          name: drug.manufacturer,
        }
      : undefined,
    nonProprietaryName: drug.activeIngredient?.[0],
    offers:
      typeof drug.price?.public === 'number'
        ? {
            '@type': 'Offer',
            priceCurrency: drug.price.currency ?? 'MAD',
            price: drug.price.public,
            availability: 'https://schema.org/InStock',
          }
        : undefined,
    inLanguage: 'fr-MA',
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(drugSchema) }}
      />
      <FicheMedicament drug={drug} />
    </main>
  )
}
