"use client";

import { useState, useEffect } from "react";
import { useDrugs, useDrugFilters } from "@/hooks/useDrugs";
import { AlphabetFilter } from "@/components/AlphabetFilter";
import { DrugFilters } from "@/components/DrugFilters";
import { VirtualizedDrugList } from "@/components/VirtualizedDrugList";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Medicaments() {
  const { data: drugs = [], isLoading, error } = useDrugs();
  const { filters, setFilters, filteredDrugs, manufacturers, therapeuticClasses } = useDrugFilters(drugs);
  const [listHeight, setListHeight] = useState(600);

  useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 100;
      const filtersHeight = 200;
      const footerHeight = 100;
      const padding = 40;
      
      const availableHeight = viewportHeight - headerHeight - filtersHeight - footerHeight - padding;
      setListHeight(Math.max(400, availableHeight));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p>Impossible de charger les données des médicaments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Médicaments</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de données des médicaments</h1>
          {!isLoading && (
            <p className="text-muted-foreground mt-2">
              {filteredDrugs.length} médicament{filteredDrugs.length !== 1 ? 's' : ''} disponible{filteredDrugs.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <AlphabetFilter
            selectedLetter={filters.letter}
            onLetterSelect={(letter) => setFilters(prev => ({ ...prev, letter }))}
          />
          
          <DrugFilters
            filters={filters}
            onFiltersChange={setFilters}
            manufacturers={manufacturers}
            therapeuticClasses={therapeuticClasses}
          />
          
          <VirtualizedDrugList drugs={filteredDrugs} height={listHeight} />
        </>
      )}
    </div>
  );
}