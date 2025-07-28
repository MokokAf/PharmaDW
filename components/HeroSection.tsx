'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const HeroSection = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/medicaments?search=${encodeURIComponent(query.trim())}`);
  };
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0" style={{ backgroundImage: "url('/imagepharma.jpg')" }} />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-medium text-foreground mb-4 leading-tight">
              <span className="block text-left">Votre référence</span>
              <span className="block text-right text-primary">pharmaceutique au Maroc</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La base de données de médicaments la plus complète au Maroc
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Médicament, Principe actif, Laboratoire..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="pl-10 pr-24 sm:pl-14 sm:pr-40 py-4 sm:py-6 text-base sm:text-lg rounded-full border-2 border-border focus:border-primary shadow-medium h-12 sm:h-16 placeholder:text-transparent sm:placeholder:text-gray-500 dark:sm:placeholder:text-gray-400"
                />
                <Button
                  variant="medical"
                  size="lg"
                  onClick={handleSearch}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 rounded-full px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base"
                >
                  Rechercher
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;