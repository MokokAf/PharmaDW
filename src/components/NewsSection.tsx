import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ExternalLink, ArrowRight } from "lucide-react";

const NewsSection = () => {
  const news = [
    {
      title: "VIH : la FDA autorise la PrEP injectable",
      author: "Abderrahim Derraji",
      date: "23 juin 2025",
      source: "ledauphine.com",
      excerpt: "L'Agence américaine du médicament (FDA) a récemment approuvé un nouveau traitement préventif contre le VIH : Yeztugo®, une injection semestrielle destinée à réduire le risque d'infection chez les adultes et adolescents à risque.",
      category: "Innovation",
      isNew: true
    },
    {
      title: "Effets cardiovasculaires des traitements du TDAH: une méta-analyse rassurante",
      author: "Abderrahim Derraji", 
      date: "17 avril 2025",
      source: "",
      excerpt: "Une revue systématique et méta-analyse en réseau récente a comparé les effets cardiovasculaires des médicaments utilisés dans la prise en charge du trouble du déficit de l'attention avec ou sans hyperactivité (TDAH).",
      category: "Recherche",
      isNew: false
    },
    {
      title: "Méthotrexate : un risque de surdosage encore trop fréquent!",
      author: "Abderrahim Derraji",
      date: "18 mars 2025", 
      source: "",
      excerpt: "L'Agence nationale de sécurité du médicament et des produits de santé (ANSM-France) alerte sur les surdosages de méthotrexate, souvent liés à une prise quotidienne au lieu d'une prise hebdomadaire.",
      category: "Sécurité",
      isNew: false
    },
    {
      title: "Association CBD et médicaments : un risque sous-estimé",
      author: "Abderrahim Derraji",
      date: "18 mars 2025",
      source: "",
      excerpt: "L'Agence nationale de sécurité du médicament et des produits de santé (ANSM-France) alerte sur les interactions entre le cannabidiol (CBD) et certains médicaments.",
      category: "Alerte",
      isNew: false
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Innovation": return "bg-secondary text-secondary-foreground";
      case "Recherche": return "bg-primary text-primary-foreground";
      case "Sécurité": return "bg-destructive text-destructive-foreground";
      case "Alerte": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <section id="actualites" className="py-20 bg-background">
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