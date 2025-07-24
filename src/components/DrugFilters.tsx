import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DrugFilters as DrugFiltersType } from '@/types/medication';

interface DrugFiltersProps {
  filters: DrugFiltersType;
  onFiltersChange: (filters: DrugFiltersType) => void;
  manufacturers: string[];
  therapeuticClasses: string[];
}

export function DrugFilters({ 
  filters, 
  onFiltersChange, 
  manufacturers, 
  therapeuticClasses 
}: DrugFiltersProps) {
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      letter: '',
      manufacturer: '',
      therapeuticClass: '',
    });
  };

  const hasActiveFilters = filters.search || filters.manufacturer || filters.therapeuticClass;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Rechercher un médicament ou principe actif..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          value={filters.manufacturer}
          onValueChange={(value) => onFiltersChange({ ...filters, manufacturer: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Laboratoire" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les laboratoires</SelectItem>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.therapeuticClass}
          onValueChange={(value) => onFiltersChange({ ...filters, therapeuticClass: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Classe thérapeutique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les classes</SelectItem>
            {therapeuticClasses.map((therapeuticClass) => (
              <SelectItem key={therapeuticClass} value={therapeuticClass}>
                {therapeuticClass}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Effacer les filtres
          </Button>
        )}
      </div>
    </div>
  );
}