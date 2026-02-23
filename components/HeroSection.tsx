'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Pill } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import DwaIALogo from "@/components/DwaIALogo";
import { getAllDrugs } from "@/lib/drugService";
import { MedDrug } from "@/types/medication";

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function scoreSuggestion(drug: MedDrug, q: string): number {
  const name = normalize(drug.name);
  const query = normalize(q);

  if (name === query) return 0;
  if (name.startsWith(query)) return 1;

  const nameWords = name.split(/[\s,/()]+/);
  if (nameWords.some(w => w.startsWith(query))) return 2;

  const ingredients = drug.activeIngredient.map(normalize);
  if (ingredients.some(ing => ing.startsWith(query))) return 3;
  if (ingredients.some(ing => ing.includes(query))) return 4;

  if (name.includes(query)) return 5;

  return 6;
}

const HeroSection = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [drugs, setDrugs] = useState<MedDrug[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    getAllDrugs().then(setDrugs);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || drugs.length === 0) return [];

    const nq = normalize(q);
    const matches: { drug: MedDrug; score: number }[] = [];

    for (const drug of drugs) {
      const name = normalize(drug.name);
      const ingredients = drug.activeIngredient.map(normalize);

      if (
        name.includes(nq) ||
        ingredients.some(ing => ing.includes(nq))
      ) {
        matches.push({ drug, score: scoreSuggestion(drug, q) });
      }

      if (matches.length >= 100) break;
    }

    matches.sort((a, b) => a.score - b.score || a.drug.name.localeCompare(b.drug.name));
    return matches.slice(0, 8).map(m => m.drug);
  }, [query, drugs]);

  useEffect(() => {
    setSelectedIndex(-1);
    setShowDropdown(suggestions.length > 0);
  }, [suggestions]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/medicaments?search=${encodeURIComponent(query.trim())}`);
  }, [query, router]);

  const handleSelect = useCallback((drug: MedDrug) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/medicaments/${drug.id}`);
  }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, [showDropdown, suggestions, selectedIndex, handleSearch, handleSelect]);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const nq = normalize(q);
    const nt = normalize(text);
    const idx = nt.indexOf(nq);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-primary">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <section className="bg-surface">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center mb-0">
            <DwaIALogo size="lg" />
          </div>

          <div className="relative max-w-xl mx-auto" ref={wrapperRef}>
            <Search className="absolute left-4 top-[28px] -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={isMobile ? "Rechercher un médicament..." : "Médicament, principe actif, laboratoire..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-14 sm:pr-32 h-14 text-base rounded-full border-2 border-border focus:border-primary shadow-sm"
              autoComplete="off"
              role="combobox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
            />
            <Button
              onClick={handleSearch}
              variant="accent"
              className="absolute right-2 top-[28px] -translate-y-1/2 rounded-full h-11 w-11 sm:w-auto sm:px-6 z-10"
            >
              <Search className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Rechercher</span>
            </Button>

            {showDropdown && suggestions.length > 0 && (
              <ul
                id="search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[60px] bg-background border border-border rounded-2xl shadow-lg overflow-hidden z-50"
              >
                {suggestions.map((drug, i) => (
                  <li
                    key={drug.id}
                    role="option"
                    aria-selected={i === selectedIndex}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      i === selectedIndex
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50'
                    } ${i > 0 ? 'border-t border-border/50' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(drug); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <Pill className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-tight truncate">
                        {highlightMatch(drug.name, query)}
                      </p>
                      {drug.activeIngredient.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {drug.activeIngredient.join(', ')}
                        </p>
                      )}
                    </div>
                    {drug.dosageForm && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                        {drug.dosageForm}
                      </span>
                    )}
                  </li>
                ))}
                <li
                  className="px-4 py-2.5 text-xs text-center text-primary font-medium cursor-pointer hover:bg-muted/50 border-t border-border/50"
                  onMouseDown={(e) => { e.preventDefault(); handleSearch(); }}
                >
                  Voir tous les résultats pour &laquo; {query} &raquo;
                </li>
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 max-w-lg mx-auto">
            <Link
              href="/pharmacies-de-garde"
              className="flex items-center gap-3 p-4 min-h-14 rounded-xl border border-border bg-background hover:shadow-md hover:border-primary/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">Pharmacies de Garde</p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden xs:block">Ouverte maintenant</p>
              </div>
            </Link>

            <Link
              href="/medicaments"
              className="flex items-center gap-3 p-4 min-h-14 rounded-xl border border-border bg-background hover:shadow-md hover:border-primary/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">Médicaments</p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden xs:block">Base de données</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
