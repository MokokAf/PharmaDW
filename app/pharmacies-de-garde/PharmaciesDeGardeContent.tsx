'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, PhoneCall, AlertTriangle, Navigation, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const POP_RANK: Record<string, number> = {
  Casablanca: 1,
  Rabat: 2,
  'Fès': 3,
  Marrakech: 4,
  Tanger: 5,
  Agadir: 6,
  'Meknès': 7,
  Oujda: 8,
  'Tétouan': 9,
  'Kénitra': 10,
  'Salé': 11,
  'Témara': 12,
  Safi: 13,
  'El Jadida': 14,
  Mohammedia: 15,
  Khouribga: 16,
}

interface Pharmacy {
  city: string
  area: string
  name: string
  address: string
  phone: string
  district: string
  duty: string
  source: string
  sources_count?: number
  date: string
  scraped_at?: string
}

interface PharmacyMeta {
  scraped_at: string
  total_pharmacies: number
  cities_count: number
  cities: string[]
  sources_used: string[]
  sources_status: Record<string, { ok: boolean; count: number; error?: string }>
  previous_total: number
  delta: number | null
}

function formatFrenchDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

function hoursAgo(isoDate: string): number {
  try {
    return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60)
  } catch {
    return 0
  }
}

export default function PharmaciesDeGardeContent() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [meta, setMeta] = useState<PharmacyMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [city, setCity] = useState<string>('')
  const [filter, setFilter] = useState('')

  const cities = useMemo(() => {
    const unique = Array.from(new Set(pharmacies.map((p) => p.city)))
    return unique.sort((a, b) => {
      const aRank = POP_RANK[a] ?? 1_000_000
      const bRank = POP_RANK[b] ?? 1_000_000
      if (aRank !== bRank) {
        return aRank - bRank
      }
      return a.localeCompare(b)
    })
  }, [pharmacies])

  useEffect(() => {
    const GITHUB_DATA =
      'https://raw.githubusercontent.com/MokokAf/PharmaDW/main/public/data'

    async function fetchWithFallback(file: string): Promise<Response> {
      try {
        const resp = await fetch(`${GITHUB_DATA}/${file}`)
        if (resp.ok) return resp
      } catch {
        /* GitHub unavailable — fall back to local static copy */
      }
      return fetch(`/data/${file}`)
    }

    async function fetchData() {
      try {
        const [phRes, metaRes] = await Promise.all([
          fetchWithFallback('pharmacies.json'),
          fetchWithFallback('pharmacies_meta.json').catch(() => null),
        ])
        if (!phRes.ok) {
          throw new Error('Erreur de chargement des donnees.')
        }
        const json = (await phRes.json()) as Pharmacy[]
        setPharmacies(json)

        if (metaRes && metaRes.ok) {
          const metaJson = (await metaRes.json()) as PharmacyMeta
          setMeta(metaJson)
        }
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Une erreur est survenue pendant le chargement.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData().catch(() => {
      setError('Une erreur est survenue pendant le chargement.')
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!city) {
      return []
    }

    let result = pharmacies.filter((p) => p.city === city)
    if (filter) {
      const normalizedFilter = filter.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedFilter) ||
          p.district.toLowerCase().includes(normalizedFilter) ||
          p.area.toLowerCase().includes(normalizedFilter)
      )
    }

    return result
  }, [city, filter, pharmacies])

  const isStale = meta ? hoursAgo(meta.scraped_at) > 48 : false

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Pharmacies de garde au Maroc</h1>

      {/* Freshness banner */}
      {meta && (
        <div className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4 text-xs',
          isStale
            ? 'border border-amber-200/60 bg-amber-50/50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400'
            : 'border border-border bg-muted/50 text-muted-foreground'
        )}>
          {isStale ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Les donnees peuvent ne pas etre a jour.
                Derniere mise a jour : <strong>{formatFrenchDate(meta.scraped_at)}</strong>
              </span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Mis a jour le <strong>{formatFrenchDate(meta.scraped_at)}</strong>
                {' '}&middot;{' '}{meta.total_pharmacies} pharmacies dans {meta.cities_count} villes
              </span>
            </>
          )}
        </div>
      )}

      {!loading && cities.length > 0 && (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border/50">
          <div className="scroll-strip gap-2">
            {cities.map((cityName) => (
              <button
                key={cityName}
                onClick={() => setCity(cityName)}
                className={cn(
                  'shrink-0 rounded-full px-4 min-h-11 text-sm font-medium transition-colors',
                  city === cityName
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      )}

      {city && (
        <div className="relative mt-4 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrer par quartier ou nom..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="pl-10 h-11 rounded-lg"
          />
        </div>
      )}

      {loading && (
        <div className="space-y-3 py-2" aria-live="polite" aria-busy="true">
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-5 space-y-3">
              <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
              <div className="h-12 w-full bg-muted rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive mt-4" role="alert">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !city && (
        <p className="text-center text-muted-foreground py-12">Selectionnez une ville ci-dessus.</p>
      )}

      {!loading && !error && city && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3 animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Aucune pharmacie disponible</h2>
          <p className="text-sm text-muted-foreground">Aucune pharmacie de garde n&apos;a ete trouvee pour {city}. Essayez un autre quartier ou une autre ville.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4 mt-2 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {filtered.length} pharmacie{filtered.length > 1 ? 's' : ''} de garde a {city}
          </p>

          {filtered.map((pharmacy, index) => (
            <div key={`${pharmacy.name}-${index}`} className="rounded-xl border border-border bg-background p-5 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-foreground">{pharmacy.name}</h2>
                </div>
                {(pharmacy.district || pharmacy.area) && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    {pharmacy.district || pharmacy.area}
                  </p>
                )}
                {pharmacy.duty && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                    {pharmacy.duty}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {pharmacy.phone && (
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="flex items-center justify-center gap-2 flex-1 h-12 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Appeler
                  </a>
                )}

                <a
                  href={`geo:0,0?q=${encodeURIComponent(`${pharmacy.name} ${pharmacy.district || pharmacy.area} ${pharmacy.city}`)}`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.name} ${pharmacy.district || pharmacy.area} ${pharmacy.city}`)}`,
                      '_blank'
                    )
                  }}
                  className="flex items-center justify-center gap-2 flex-1 h-12 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 active:scale-[0.98] transition"
                >
                  <Navigation className="h-4 w-4" />
                  Localiser
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
        {meta && (
          <p>
            {meta.sources_used.length} sources consultees &middot; Derniere mise a jour : <span className="font-medium">{formatFrenchDate(meta.scraped_at)}</span>
          </p>
        )}
        {!meta && filtered[0]?.date && (
          <p>
            Derniere mise a jour : <span className="font-medium">{filtered[0].date}</span>
          </p>
        )}
      </div>
    </main>
  )
}
