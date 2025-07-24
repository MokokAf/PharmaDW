import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-medical.jpg";

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-subtle overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
              Votre référence
              <span className="block text-primary">pharmaceutique au Maroc</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre base de données complète de médicaments, restez informé des actualités pharmaceutiques et profitez de notre IA dédiée aux pharmaciens.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Rechercher un médicament, un laboratoire, une substance active..."
                  className="pl-14 pr-40 py-6 text-lg rounded-full border-2 border-border focus:border-primary shadow-medium h-16"
                />
                <Button 
                  variant="medical" 
                  size="lg" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full px-8 h-12"
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