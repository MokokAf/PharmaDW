import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MedDrug, DrugFilters } from '@/types/medication';
import { getAllDrugs, getUniqueManufacturers, getUniqueTherapeuticClasses } from '@/lib/drugService';

export function useDrugs() {
  return useQuery({
    queryKey: ['drugs'],
    queryFn: getAllDrugs,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDrugFilters(drugs: MedDrug[]) {
  const [filters, setFilters] = useState<DrugFilters>({
    search: '',
    letter: '',
    manufacturer: '',
    therapeuticClass: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const filteredDrugs = useMemo(() => {
    let filtered = drugs;

    // Search filter (name and active ingredients)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(drug => 
        drug.name.toLowerCase().includes(searchLower) ||
        drug.activeIngredient.some(ingredient => 
          ingredient.toLowerCase().includes(searchLower)
        )
      );
    }

    // Alphabet filter
    if (filters.letter) {
      if (filters.letter === '#') {
        filtered = filtered.filter(drug => 
          /^[0-9]/.test(drug.name)
        );
      } else {
        filtered = filtered.filter(drug => 
          drug.name.toUpperCase().startsWith(filters.letter)
        );
      }
    }

    // Manufacturer filter
    if (filters.manufacturer) {
      filtered = filtered.filter(drug => 
        drug.manufacturer === filters.manufacturer
      );
    }

    // Therapeutic class filter
    if (filters.therapeuticClass) {
      filtered = filtered.filter(drug => 
        drug.therapeuticClass?.includes(filters.therapeuticClass)
      );
    }

    return filtered;
  }, [drugs, debouncedSearch, filters.letter, filters.manufacturer, filters.therapeuticClass]);

  const manufacturers = useMemo(() => getUniqueManufacturers(drugs), [drugs]);
  const therapeuticClasses = useMemo(() => getUniqueTherapeuticClasses(drugs), [drugs]);

  return {
    filters,
    setFilters,
    filteredDrugs,
    manufacturers,
    therapeuticClasses,
  };
}