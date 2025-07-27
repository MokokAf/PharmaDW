import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ExternalLink, ArrowRight } from "lucide-react";

const NewsSection = () => {
  const news = [
    {
      title: "Nouveau traitement révolutionnaire contre l'Alzheimer approuvé",
      author: "Dr. Sarah El Mansouri",
      date: "15 décembre 2025",
      source: "pharmanews.ma",
      excerpt: "L'ANMDM (Agence Nationale du Médicament et des Dispositifs Médicaux) vient d'approuver AlzProtect®, un traitement novateur qui ralentit significativement la progression de la maladie d'Alzheimer chez les patients en stade précoce.",
      category: "Innovation",
      isNew: true
    },
    {
      title: "Pénurie mondiale d'amoxicilline : stratégies d'adaptation au Maroc",
      author: "Pr. Ahmed Bennani", 
      date: "28 novembre 2025",
      source: "revuepharmaceutique.ma",
      excerpt: "Face à la pénurie mondiale d'amoxicilline, le Ministère de la Santé marocain met en place des mesures d'urgence pour garantir l'approvisionnement en antibiotiques essentiels. Focus sur les alternatives thérapeutiques disponibles.",
      category: "Approvisionnement",
      isNew: true
    },
    {
      title: "Intelligence artificielle en pharmacie : révolution de la dispensation",
      author: "Dr. Fatima Zahra Alami",
      date: "20 novembre 2025", 
      source: "innovation-pharma.ma",
      excerpt: "Une étude pilote menée dans 15 pharmacies de Casablanca démontre l'efficacité de l'IA dans la détection des interactions médicamenteuses et l'optimisation des conseils pharmaceutiques.",
      category: "Technologie",
      isNew: true
    },
    {
      title: "Biosimilaires : nouvelles recommandations de substitution",
      author: "Pr. Khalid Zerouali",
      date: "10 novembre 2025",
      source: "guidelines-pharma.ma",
      excerpt: "L'ANMDM publie de nouvelles directives sur l'utilisation des médicaments biosimilaires, facilitant leur intégration dans la pratique pharmaceutique tout en garantissant la sécurité des patients.",
      category: "Réglementation",
      isNew: false
    },
    {
      title: "Pharmacovigilance renforcée : nouveau système de déclaration digitale",
      author: "Dr. Youssef Tadlaoui",
      date: "5 novembre 2025",
      source: "securite-medicament.ma",
      excerpt: "Lancement d'une plateforme digitale innovante permettant aux professionnels de santé de déclarer plus facilement les effets indésirables, renforçant ainsi la surveillance post-commercialisation.",
      category: "Sécurité",
      isNew: false
    },
    {
      title: "Phytothérapie moderne : validation scientifique des plantes médicinales marocaines",
      author: "Dr. Aicha Benjelloun",
      date: "25 octobre 2025",
      source: "phyto-recherche.ma",
      excerpt: "Des chercheurs marocains valident scientifiquement l'efficacité de plusieurs plantes médicinales traditionnelles, ouvrant la voie à de nouveaux médicaments à base de plantes standardisés.",
      category: "Recherche",
      isNew: false
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Innovation": return "bg-green-100 text-green-800 border-green-200";
      case "Approvisionnement": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Technologie": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Réglementation": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Sécurité": return "bg-red-100 text-red-800 border-red-200";
      case "Recherche": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <section id="actualites" className="py-20 bg-background hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            À la une
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Restez informé des dernières actualités pharmaceutiques
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {news.map((article, index) => (
            <Card key={index} className="group hover:shadow-medium transition-all duration-300 cursor-pointer border-border hover:border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getCategoryColor(article.category)}>
                    {article.category}
                  </Badge>
                  {article.isNew && (
                    <Badge variant="outline" className="border-secondary text-secondary">
                      Nouveau
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{article.date}</span>
                    </div>
                  </div>
                  {article.source && (
                    <div className="flex items-center space-x-1">
                      <ExternalLink className="h-4 w-4" />
                      <span>{article.source}</span>
                    </div>
                  )}
                </div>
                
                <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                  Lire la suite
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="medical" size="lg">
            Archive des actualités
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;