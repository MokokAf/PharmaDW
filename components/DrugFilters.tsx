'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { DrugFilters as DrugFiltersType, TherapeuticClassOption } from '@/types/medication';
import { TherapeuticClassCombobox } from '@/components/TherapeuticClassCombobox';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface DrugFiltersProps {
  filters: DrugFiltersType;
  onFiltersChange: (filters: DrugFiltersType) => void;
  manufacturers: string[];
  therapeuticClasses: TherapeuticClassOption[];
}

export function DrugFilters({
  filters,
  onFiltersChange,
  manufacturers,
  therapeuticClasses
}: DrugFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      letter: '',
      manufacturer: '',
      therapeuticClass: '',
    });
  };

  const hasActiveFilters = filters.manufacturer || filters.therapeuticClass;
  const activeCount = [filters.manufacturer, filters.therapeuticClass].filter(Boolean).length;

  const filterSelects = (
    <div className="space-y-4">
      <Select
        value={filters.manufacturer || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, manufacturer: value === 'all' ? '' : value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Laboratoire" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les laboratoires</SelectItem>
          {manufacturers.map((manufacturer) => (
            <SelectItem key={manufacturer} value={manufacturer}>
              {manufacturer}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TherapeuticClassCombobox
        options={therapeuticClasses}
        value={filters.therapeuticClass}
        onValueChange={(value) => onFiltersChange({ ...filters, therapeuticClass: value })}
      />

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full h-11 flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Effacer les filtres
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Search — always visible */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="drug-search" className="sr-only">
            Rechercher un medicament
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="drug-search"
            placeholder="Rechercher un médicament..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 h-11 rounded-lg"
          />
        </div>

        {/* Mobile: drawer trigger */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 md:hidden relative"
              aria-label="Ouvrir les filtres avances"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtres</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8">
              {filterSelects}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: inline filters */}
      <div className="hidden md:grid md:grid-cols-2 gap-3">
        <Select
          value={filters.manufacturer || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, manufacturer: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Laboratoire" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les laboratoires</SelectItem>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TherapeuticClassCombobox
          options={therapeuticClasses}
          value={filters.therapeuticClass}
          onValueChange={(value) => onFiltersChange({ ...filters, therapeuticClass: value })}
        />
      </div>

      {hasActiveFilters && (
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-11 text-muted-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
