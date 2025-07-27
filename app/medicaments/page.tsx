import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MedDrug, DrugFilters } from "@/types/medication";
import { BackHomeButton } from "@/components/BackHomeButton";
import { AlphabetFilter } from "@/components/AlphabetFilter";
import { DrugFilters as DrugFiltersComponent } from "@/components/DrugFilters";
import { Separator } from "@/components/ui/separator";
import { VirtualizedDrugList } from "@/components/VirtualizedDrugList";
import MedicamentsContent from "./MedicamentsContent";

export default function MedicamentsPage() {
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

    // Apply filters
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

  return (
    <main className="container mx-auto py-8 space-y-6">
      <BackHomeButton />
      <h1 className="text-2xl font-semibold">Médicaments</h1>
      <AlphabetFilter
        selectedLetter={filters.letter}
        onLetterSelect={(letter) => setFilters({ ...filters, letter })}
      />
      <DrugFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        manufacturers={manufacturers}
        therapeuticClasses={therapeuticClasses}
      />
      <Separator />
      <VirtualizedDrugList drugs={filteredDrugs} height={600} />
    </main>
  );
}
