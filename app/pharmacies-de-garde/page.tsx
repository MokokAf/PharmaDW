"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, PhoneCall, AlertTriangle } from "lucide-react";

interface Pharmacy {
  city: string;
  area: string;
  name: string;
  address: string;
  phone: string;
  district: string;
  duty: string;
  source: string;
  date: string;
}

const CITIES = [
  "Rabat",
  "Salé",
  "Témara",
  "Kénitra",
  "Casablanca",
  "Fès",
  "Tanger",
  "Marrakech",
] as const;

type City = (typeof CITIES)[number];

export default function PharmaciesDeGardePage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState<City | "">("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/pharmacies.json");
        if (!res.ok) throw new Error("Erreur de chargement des données");
        const json: Pharmacy[] = await res.json();
        setPharmacies(json);
      } catch (err: any) {
        setError(err.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = pharmacies;
    if (city) list = list.filter((p) => p.city === city);
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(f) ||
          p.district.toLowerCase().includes(f) ||
          p.area.toLowerCase().includes(f)
      );
    }
    return list;
  }, [pharmacies, city, filter]);

  // derive metadata (date, source) from the selected city
  const lastUpdate = filtered[0]?.date ?? "";
  const source = filtered[0]?.source ?? "";

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center">
        Pharmacies de Garde
      </h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" htmlFor="city">
            Ville
          </label>
          <Select onValueChange={(v: City) => setCity(v)} value={city as string}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Choisissez une ville" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" htmlFor="filter">
            Filtrer par quartier ou nom
          </label>
          <Input
            id="filter"
            placeholder="Tapez un quartier ou une pharmacie..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && city && filtered.length === 0 && (
        <p className="text-center text-muted-foreground">
          Aucune pharmacie de garde trouvée pour {city} aujourd&#39;hui.
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((p, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 shadow-sm bg-card flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold mb-1">{p.name}</h2>
                <p className="text-sm text-muted-foreground mb-2 flex items-start gap-1">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  {p.address || "Adresse non disponible"}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Quartier&nbsp;:</span> {p.district}
                </p>
                <p className="text-sm mb-4">
                  <span className="font-medium">Garde&nbsp;:</span> {p.duty}
                </p>
              </div>
              <a
                href={`tel:${p.phone.replace(/[^+\d]/g, "")}`}
                className="mt-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 transition"
              >
                <PhoneCall className="h-4 w-4" /> Appeler
              </a>
            </div>
          ))}
        </div>
      )}

      {/* footer info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        {lastUpdate && (
          <p>
            Dernière mise à jour&nbsp;: <span className="font-medium">{lastUpdate}</span>
          </p>
        )}
        {source && <p>Source&nbsp;: {source}</p>}
      </div>
    </main>
  );
}
