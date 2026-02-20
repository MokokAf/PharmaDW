import type { MetadataRoute } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import type { MedDrug } from '@/types/medication'
import { absoluteUrl } from '@/lib/seo'

const dataPath = path.join(process.cwd(), 'public/data/medicament_ma_optimized.json')

const staticRoutes = [
  {
    path: '/',
    priority: 1,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/medicaments',
    priority: 0.9,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/pharmacies-de-garde',
    priority: 0.85,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/espace-pharmaciens',
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  let drugs: MedDrug[] = []
  try {
    const raw = await fs.readFile(dataPath, 'utf8')
    drugs = JSON.parse(raw) as MedDrug[]
  } catch {
    drugs = []
  }

  const routeEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const drugEntries: MetadataRoute.Sitemap = drugs.map((drug) => {
    const updatedAt = drug.updatedAt ? new Date(drug.updatedAt) : now
    const safeDate = Number.isNaN(updatedAt.getTime()) ? now : updatedAt

    return {
      url: absoluteUrl(`/medicaments/${drug.id}`),
      lastModified: safeDate,
      changeFrequency: 'weekly',
      priority: 0.65,
    }
  })

  return [...routeEntries, ...drugEntries]
}

export const revalidate = 60 * 60 * 24

// Keep metadata routes aligned with configured site URL.
export const dynamic = 'force-static'
