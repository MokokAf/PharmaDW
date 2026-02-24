'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MedDrugListItem, DrugFilters, TherapeuticClassOption } from '@/types/medication'

/**
 * Clean up therapeutic class list for dropdown display:
 * - Remove barcode numbers (all-digit strings)
 * - Remove overly long entries (descriptions, not real class names)
 * - Case-insensitive dedup (keep most frequent variant)
 * - Merge singular/plural near-duplicates (trailing 's')
 * - Return with drug counts for each class
 */
function deduplicateClasses(allClasses: string[]): TherapeuticClassOption[] {
  const clean = allClasses.filter(
    (c) => c && !/^\d{5,}$/.test(c.trim()) && c.trim().length <= 80
  )

  // Group by lowercase → count each exact variant
  const groups = new Map<string, Map<string, number>>()
  for (const c of clean) {
    const key = c.toLowerCase().trim()
    if (!groups.has(key)) groups.set(key, new Map())
    const m = groups.get(key)!
    m.set(c, (m.get(c) ?? 0) + 1)
  }

  // For each group pick the most frequent casing
  const best = new Map<string, { label: string; total: number }>()
  groups.forEach((variants, key) => {
    let topLabel = ''
    let topCount = 0
    let total = 0
    variants.forEach((count, v) => {
      total += count
      if (count > topCount) { topLabel = v; topCount = count }
    })
    best.set(key, { label: topLabel, total })
  })

  // Merge singular/plural: "vaccins" + "vaccin" → keep the one with more mentions
  const dropped = new Set<string>()
  Array.from(best.keys()).forEach((key) => {
    if (dropped.has(key)) return
    const singular = key.endsWith('s') ? key.slice(0, -1) : null
    if (singular && best.has(singular) && !dropped.has(singular)) {
      const pEntry = best.get(key)!
      const sEntry = best.get(singular)!
      if (pEntry.total >= sEntry.total) {
        pEntry.total += sEntry.total
        dropped.add(singular)
      } else {
        sEntry.total += pEntry.total
        dropped.add(key)
      }
    }
  })

  return Array.from(best.entries())
    .filter(([key]) => !dropped.has(key))
    .map(([, { label, total }]) => ({ label, count: total }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

const VirtualizedDrugList = dynamic(
  () => import('@/components/VirtualizedDrugList').then((module) => module.VirtualizedDrugList),
  { ssr: false }
)
const AlphabetFilter = dynamic(
  () => import('@/components/AlphabetFilter').then((module) => module.AlphabetFilter),
  { ssr: false }
)
const DrugFiltersComponent = dynamic(
  () => import('@/components/DrugFilters').then((module) => module.DrugFilters),
  { ssr: false }
)

export default function MedicamentsContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') ?? ''

  const [drugs, setDrugs] = useState<MedDrugListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [filters, setFilters] = useState<DrugFilters>({
    search: initialSearch,
    letter: '',
    manufacturer: '',
    therapeuticClass: '',
  })

  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [therapeuticClasses, setTherapeuticClasses] = useState<TherapeuticClassOption[]>([])

  const loadDrugs = useCallback(async () => {
    setError(null)

    if (drugs.length === 0) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const res = await fetch('/data/medicament_list_index.json?nocache', {
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`Fichier JSON indisponible (${res.status})`)
      }

      const text = await res.text()
      if (!text) {
        throw new Error('Reponse JSON vide')
      }

      const raw = JSON.parse(text) as MedDrugListItem[]
      // Deduplicate by name — keep first occurrence
      const seen = new Set<string>()
      const data = raw.filter((d) => {
        if (seen.has(d.name)) return false
        seen.add(d.name)
        return true
      })
      setDrugs(data)

      const nextManufacturers = Array.from(new Set(data.map((item) => item.manufacturer).filter((m) => m && m !== 'NON RENSEIGNÉ'))) as string[]
      const rawClasses = data.flatMap((item) => item.therapeuticClass ?? [])

      setManufacturers(nextManufacturers.sort((a, b) => a.localeCompare(b)))
      setTherapeuticClasses(deduplicateClasses(rawClasses))
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Une erreur est survenue pendant le chargement des medicaments.'
      setError(message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [drugs.length])

  useEffect(() => {
    void loadDrugs()
  }, [loadDrugs])

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: initialSearch,
    }))
  }, [initialSearch])

  const filteredDrugs = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()

    return drugs.filter((item) => {
      if (
        normalizedSearch &&
        !item.name.toLowerCase().includes(normalizedSearch) &&
        !item.activeIngredient.some((ingredient) => ingredient.toLowerCase().includes(normalizedSearch))
      ) {
        return false
      }

      if (filters.letter && !item.name.toLowerCase().startsWith(filters.letter.toLowerCase())) {
        return false
      }

      if (filters.manufacturer && item.manufacturer !== filters.manufacturer) {
        return false
      }

      if (filters.therapeuticClass) {
        const filterKey = filters.therapeuticClass.toLowerCase().replace(/s$/, '')
        const match = (item.therapeuticClass ?? []).some((tc) => {
          const tcKey = tc.toLowerCase().replace(/s$/, '')
          return tcKey === filterKey
        })
        if (!match) return false
      }

      return true
    })
  }, [drugs, filters])

  const sortedDrugs = useMemo(() => {
    const q = filters.search.trim()
    if (!q) {
      return [...filteredDrugs].sort((a, b) => a.name.localeCompare(b.name))
    }

    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const nq = normalize(q)

    const scored = filteredDrugs.map((drug) => {
      const name = normalize(drug.name)
      let score = 6
      if (name === nq) score = 0
      else if (name.startsWith(nq)) score = 1
      else if (name.split(/[\s,/()]+/).some(w => w.startsWith(nq))) score = 2
      else {
        const ings = drug.activeIngredient.map(normalize)
        if (ings.some(i => i.startsWith(nq))) score = 3
        else if (ings.some(i => i.includes(nq))) score = 4
        else if (name.includes(nq)) score = 5
      }
      return { drug, score }
    })

    scored.sort((a, b) => a.score - b.score || a.drug.name.localeCompare(b.drug.name))
    return scored.map(s => s.drug)
  }, [filteredDrugs, filters.search])

  const hasActiveFilters = Boolean(filters.search || filters.letter || filters.manufacturer || filters.therapeuticClass)

  const resetFilters = () => {
    setFilters({
      search: '',
      letter: '',
      manufacturer: '',
      therapeuticClass: '',
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      <h1 className="text-2xl font-semibold leading-tight">Medicaments</h1>

      {isRefreshing && (
        <div className="top-loading-indicator" role="status" aria-live="polite" aria-label="Actualisation des resultats" />
      )}

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 space-y-3 border-b border-border/60">
        <DrugFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          manufacturers={manufacturers}
          therapeuticClasses={therapeuticClasses}
        />
        <AlphabetFilter selectedLetter={filters.letter} onLetterSelect={(letter) => setFilters((prev) => ({ ...prev, letter }))} />
      </div>

      {loading && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="h-5 w-36 rounded bg-muted animate-pulse" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3" role="alert" aria-live="assertive">
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <Button type="button" variant="outline" className="h-11" onClick={() => void loadDrugs()}>
            Reessayer
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {sortedDrugs.length} resultat{sortedDrugs.length !== 1 ? 's' : ''}
          </p>

          {sortedDrugs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3 animate-fade-in">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <PackageSearch className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Aucun medicament trouve</h2>
              <p className="text-sm text-muted-foreground">Essayez un autre terme de recherche ou modifiez vos filtres.</p>
              {hasActiveFilters && (
                <Button type="button" variant="outline" className="h-11" onClick={resetFilters}>
                  Reinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <VirtualizedDrugList drugs={sortedDrugs} />
          )}
        </>
      )}
    </div>
  )
}
