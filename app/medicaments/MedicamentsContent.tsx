"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VirtualizedDrugList } from "@/components/VirtualizedDrugList";
import { AlphabetFilter } from "@/components/AlphabetFilter";
import { DrugFilters as DrugFiltersComponent } from "@/components/DrugFilters";
import { MedDrug, DrugFilters } from "@/types/medication";


export default function MedicamentsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [drugs, setDrugs] = useState<MedDrug[]>([]);
  const [filters, setFilters] = useState<DrugFilters>({
    search: initialSearch,
    letter: '',
    manufacturer: '',
    therapeuticClass: '',
  });

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [therapeuticClasses, setTherapeuticClasses] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/data/medicament_ma_optimized.json?nocache", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Fichier JSON indisponible (${res.status})`);
      const text = await res.text();
      if (!text) throw new Error('Réponse JSON vide');
      const data = JSON.parse(text) as MedDrug[];
      setDrugs(data);
      setManufacturers(Array.from(new Set(data.map(d => d.manufacturer).filter(Boolean))) as string[]);
      setTherapeuticClasses(Array.from(new Set(data.flatMap(d => d.therapeuticClass ?? []))));
    })();
  }, []);

  const filteredDrugs = drugs.filter((d) => {
    if (
      filters.search &&
      !d.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !d.activeIngredient.some((ai) => ai.toLowerCase().includes(filters.search.toLowerCase()))
    ) {
      return false;
    }
    if (filters.letter && !d.name.toLowerCase().startsWith(filters.letter.toLowerCase())) {
      return false;
    }
    if (filters.manufacturer && d.manufacturer !== filters.manufacturer) {
      return false;
    }
    if (filters.therapeuticClass && !(d.therapeuticClass ?? []).includes(filters.therapeuticClass)) {
      return false;
    }
    return true;
  });

  const sortedDrugs = [...filteredDrugs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <h1 className="text-2xl font-semibold">Médicaments</h1>

        {/* Search + filters (sticky on mobile) */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 space-y-3">
          <DrugFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            manufacturers={manufacturers}
            therapeuticClasses={therapeuticClasses}
          />
          <AlphabetFilter
            selectedLetter={filters.letter}
            onLetterSelect={letter => setFilters(f => ({ ...f, letter }))}
          />
        </div>

        {/* Result count */}
        <p className="text-sm text-muted-foreground">
          {sortedDrugs.length} résultat{sortedDrugs.length !== 1 ? 's' : ''}
        </p>

        {/* Virtualized list */}
        <VirtualizedDrugList drugs={sortedDrugs} />
      </div>
    </Suspense>
  );
}
