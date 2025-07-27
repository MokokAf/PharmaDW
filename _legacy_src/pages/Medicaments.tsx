import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDrugs, useDrugFilters } from '@/hooks/useDrugs';
import { AlphabetFilter } from '@/components/AlphabetFilter';
import { DrugFilters } from '@/components/DrugFilters';
import { VirtualizedDrugList } from '@/components/VirtualizedDrugList';
import { AlertCircle } from 'lucide-react';

export default function Medicaments() {
  const { data: drugs = [], isLoading, error } = useDrugs();
  const { filters, setFilters, filteredDrugs, manufacturers, therapeuticClasses } = useDrugFilters(drugs);
  const [listHeight, setListHeight] = useState(600);

  // Calculate optimal list height based on viewport
  useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 120; // Approximate header + breadcrumb height
      const filtersHeight = 200; // Approximate filters height
      const footerMargin = 100; // Margin for footer
      
      const availableHeight = viewportHeight - headerHeight - filtersHeight - footerMargin;
      setListHeight(Math.max(400, Math.min(800, availableHeight)));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des médicaments. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
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

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Base de données des médicaments
        </h1>
        <p className="text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            `${filteredDrugs.length} médicament(s) sur ${drugs.length} au total`
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          {/* Alphabet Filter */}
          <AlphabetFilter
            selectedLetter={filters.letter}
            onLetterSelect={(letter) => setFilters({ ...filters, letter })}
          />

          {/* Search and Filters */}
          <DrugFilters
            filters={filters}
            onFiltersChange={setFilters}
            manufacturers={manufacturers}
            therapeuticClasses={therapeuticClasses}
          />

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Résultats
              </h2>
              <div className="text-sm text-muted-foreground">
                {filteredDrugs.length} médicament(s) trouvé(s)
              </div>
            </div>

            <VirtualizedDrugList 
              drugs={filteredDrugs} 
              height={listHeight}
            />
          </div>
        </>
      )}
    </div>
  );
}