'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MedDrugListItem, DrugFilters } from '@/types/medication'

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
  const [therapeuticClasses, setTherapeuticClasses] = useState<string[]>([])

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

      const data = JSON.parse(text) as MedDrugListItem[]
      setDrugs(data)

      const nextManufacturers = Array.from(new Set(data.map((item) => item.manufacturer).filter(Boolean))) as string[]
      const nextTherapeutic = Array.from(new Set(data.flatMap((item) => item.therapeuticClass ?? [])))

      setManufacturers(nextManufacturers.sort((a, b) => a.localeCompare(b)))
      setTherapeuticClasses(nextTherapeutic.sort((a, b) => a.localeCompare(b)))
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

      if (filters.therapeuticClass && !(item.therapeuticClass ?? []).includes(filters.therapeuticClass)) {
        return false
      }

      return true
    })
  }, [drugs, filters])

  const sortedDrugs = useMemo(() => {
    return [...filteredDrugs].sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredDrugs])

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
