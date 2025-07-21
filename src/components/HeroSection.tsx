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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Rechercher un médicament, un laboratoire, une substance active..."
                  className="pl-12 pr-4 py-4 text-lg rounded-full border-2 border-border focus:border-primary shadow-medium"
                />
                <Button 
                  variant="medical" 
                  size="lg" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-8"
                >
                  Rechercher
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Button variant="outline" size="lg" className="p-6 h-auto flex-col space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">💊</span>
              </div>
              <span className="font-semibold">Liste des médicaments</span>
              <span className="text-sm text-muted-foreground">5,447 références</span>
            </Button>
            
            <Button variant="outline" size="lg" className="p-6 h-auto flex-col space-y-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">🧪</span>
              </div>
              <span className="font-semibold">Laboratoires</span>
              <span className="text-sm text-muted-foreground">Tous les fabricants</span>
            </Button>
            
            <Button variant="outline" size="lg" className="p-6 h-auto flex-col space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="font-semibold">Nouveautés</span>
              <span className="text-sm text-muted-foreground">Dernières commercialisations</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;