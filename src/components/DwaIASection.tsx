import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageCircle, Lightbulb, Clock, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dwaIcon from "@/assets/dwa-ia-icon.jpg";
const DwaIASection = () => {
  const navigate = useNavigate();
  const features = [{
    icon: MessageCircle,
    title: "Analyse des interactions médicamenteuses",
    description: "Détection automatique des interactions entre médicaments avec évaluation du niveau de risque"
  }, {
    icon: Lightbulb,
    title: "Conseils de dispensation personnalisés",
    description: "Recommandations adaptées selon l'âge, le poids et les pathologies du patient"
  }, {
    icon: Shield,
    title: "Conformité réglementaire marocaine",
    description: "Informations validées selon les directives de l'ANMDM et du Ministère de la Santé"
  }, {
    icon: Clock,
    title: "Veille pharmaceutique 24h/24",
    description: "Alertes en temps réel sur les retraits de lots, ruptures de stock et nouvelles AMM"
  }, {
    icon: Zap,
    title: "Substitution générique intelligente",
    description: "Propositions automatiques de génériques disponibles avec équivalences thérapeutiques"
  }, {
    icon: Bot,
    title: "Formation continue intégrée",
    description: "Mise à jour automatique des connaissances avec les dernières recommandations HAS/OMS"
  }];
  return <section className="py-20 bg-primary relative overflow-hidden">
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
                Dwa IA 2.0
                <span className="block font-extralight text-[s#F5F7FA] text-[#f5f7fa]">Assistant pharmaceutique intelligent</span>
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                L'intelligence artificielle révolutionnaire conçue pour transformer votre exercice pharmaceutique. 
                Bénéficiez d'un accompagnement expert pour la dispensation, les interactions médicamenteuses 
                et la pharmacovigilance, directement intégré à votre pratique quotidienne.
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => <div key={index} className="flex items-start space-x-4">
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
                </div>)}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="ai" size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/espace-pharmaciens')}>
                <Bot className="w-5 h-5 mr-2" />
                Tester Dwa IA 2.0
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
                    <h3 className="font-semibold text-primary">Dwa IA 2.0</h3>
                    <p className="text-sm text-muted-foreground">Assistant pharmaceutique certifié</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Pharmacien</p>
                    <p>Patient diabétique sous metformine 850mg, peut-il prendre de l'ibuprofène pour ses douleurs articulaires?</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-primary mb-2">Dwa IA 2.0</p>
                    <p className="text-sm leading-relaxed">
                      ⚠️ <strong>Attention</strong> : L'ibuprofène peut altérer la fonction rénale et potentialiser le risque d'acidose lactique avec la metformine. 
                      <br /><br />
                      <strong>Alternatives recommandées :</strong>
                      <br />• Paracétamol 1g x3/jour (première intention)
                      <br />• Application locale de diclofénac gel si douleurs localisées
                      <br /><br />
                      <strong>Si AINS nécessaire :</strong> Surveillance fonction rénale + glycémie renforcée
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Interaction modérée
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Diabète T2
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Alternative suggérée
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Système opérationnel - Base de données mise à jour</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-medium">Prêt pour consultation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>;
};
export default DwaIASection;