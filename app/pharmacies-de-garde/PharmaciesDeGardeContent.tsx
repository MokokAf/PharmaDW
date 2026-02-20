'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin, PhoneCall, AlertTriangle, Navigation, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const POP_RANK: Record<string, number> = {
  Casablanca: 1,
  Rabat: 2,
  Fes: 3,
  Marrakech: 4,
  Tanger: 5,
  Agadir: 6,
  Meknes: 7,
  Oujda: 8,
  Tetouan: 9,
  Safi: 10,
  'El Jadida': 11,
  Mohammedia: 12,
  Khouribga: 13,
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
  date: string
}

export default function PharmaciesDeGardeContent() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
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
    async function fetchData() {
      try {
        const res = await fetch('/data/pharmacies.json')
        if (!res.ok) {
          throw new Error('Erreur de chargement des donnees.')
        }
        const json = (await res.json()) as Pharmacy[]
        setPharmacies(json)
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

  const lastUpdate = filtered[0]?.date ?? ''
  const source = filtered[0]?.source ?? ''

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-center">Pharmacies de garde au Maroc</h1>

      {!loading && cities.length > 0 && (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border/50">
          <div className="scroll-strip gap-2">
            {cities.map((cityName) => (
              <button
                key={cityName}
                onClick={() => setCity(cityName)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
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
        <div className="flex justify-center py-20" aria-live="polite" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <p className="text-center text-muted-foreground py-12">Aucune pharmacie de garde trouvee pour {city}.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4 mt-2 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {filtered.length} pharmacie{filtered.length > 1 ? 's' : ''} de garde a {city}
          </p>

          {filtered.map((pharmacy, index) => (
            <div key={`${pharmacy.name}-${index}`} className="rounded-xl border border-border bg-background p-5 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">{pharmacy.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  {pharmacy.address || 'Adresse non disponible'}
                </p>
                {pharmacy.district && <p className="text-xs text-muted-foreground mt-1 ml-[1.4rem]">{pharmacy.district}</p>}
              </div>

              <a
                href={`tel:${pharmacy.phone}`}
                className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition"
              >
                <PhoneCall className="h-4 w-4" />
                Appeler
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.name} ${pharmacy.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Voir sur la carte
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
        {lastUpdate && (
          <p>
            Derniere mise a jour : <span className="font-medium">{lastUpdate}</span>
          </p>
        )}
        {source && <p>Source : {source}</p>}
      </div>
    </main>
  )
}
