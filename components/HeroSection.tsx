'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Pill } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const HeroSection = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/medicaments?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="bg-surface">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
              Trouvez votre médicament
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Base de données pharmaceutique du Maroc
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Médicament, principe actif, laboratoire..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="pl-12 pr-28 h-14 text-base rounded-full border-2 border-border focus:border-primary shadow-sm"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 h-11"
            >
              Rechercher
            </Button>
          </div>

          {/* Quick Access Cards */}
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
