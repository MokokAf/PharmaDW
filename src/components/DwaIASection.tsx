import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageCircle, Lightbulb, Clock, Shield, Zap } from "lucide-react";
import dwaIcon from "@/assets/dwa-ia-icon.jpg";

const DwaIASection = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Consultation instantanée",
      description: "Posez vos questions pharmaceutiques et obtenez des réponses précises en temps réel"
    },
    {
      icon: Lightbulb,
      title: "Recommandations expertes",
      description: "Conseils personnalisés basés sur les dernières recherches médicales"
    },
    {
      icon: Shield,
      title: "Données vérifiées",
      description: "Informations validées par des pharmaciens et organismes de santé marocains"
    },
    {
      icon: Clock,
      title: "Disponible 24h/24",
      description: "Assistance continue pour vos urgences pharmaceutiques"
    }
  ];

  return (
    <section className="py-20 bg-gradient-health relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-glow/20 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-x-48 translate-y-48" />
      
      <div className="relative container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
                <Zap className="w-4 h-4 mr-1" />
                Nouveau
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Dwa IA
                <span className="block text-primary-glow">L'intelligence artificielle pour pharmaciens</span>
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Révolutionnez votre pratique pharmaceutique avec notre assistant IA intelligent. 
                Conçu spécialement pour les pharmaciens marocains, Dwa IA vous accompagne dans 
                vos décisions quotidiennes.
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-white/80">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="ai" size="lg" className="bg-white text-primary hover:bg-white/90">
                <Bot className="w-5 h-5 mr-2" />
                Essayer Dwa IA
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                En savoir plus
              </Button>
            </div>
          </div>

          {/* Right Content - AI Interface Preview */}
          <div className="relative">
            <Card className="bg-white/95 backdrop-blur-sm shadow-strong">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={dwaIcon} alt="Dwa IA" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Dwa IA</h3>
                    <p className="text-sm text-muted-foreground">Assistant pharmaceutique</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Vous</p>
                    <p>Quelles sont les interactions médicamenteuses entre l'aspirine et le warfarin?</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-primary mb-2">Dwa IA</p>
                    <p className="text-sm leading-relaxed">
                      L'association aspirine + warfarin présente un risque hémorragique majeur. 
                      Je recommande une surveillance renforcée de l'INR et l'ajustement des posologies...
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Interaction majeure
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Surveillance INR
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-subtle rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prêt à répondre</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                      <span className="text-secondary">En ligne</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DwaIASection;