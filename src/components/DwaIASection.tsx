import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bot, MessageCircle, Lightbulb, Clock, Shield, Zap, Send, User } from "lucide-react";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">{/* Changed items-center to items-start */}
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
          <div className="relative flex justify-center lg:justify-start">
            <Card className="w-full max-w-md h-[500px] lg:h-[600px] flex flex-col">{/* Made responsive height and added max-width */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Assistant DwaIA 2.0
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 p-0">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 pb-4">
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <p className="text-sm">Bonjour ! Je suis votre assistant IA spécialisé en pharmacie. Comment puis-je vous aider aujourd'hui ?</p>
                        <p className="text-xs opacity-70 mt-1">14:32</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <div className="max-w-[80%] rounded-lg p-3 bg-primary text-primary-foreground">
                        <p className="text-sm">Patient diabétique sous metformine 850mg, peut-il prendre de l'ibuprofène pour ses douleurs articulaires?</p>
                        <p className="text-xs opacity-70 mt-1">14:35</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <p className="text-sm">
                          ⚠️ <strong>Attention</strong> : L'ibuprofène peut altérer la fonction rénale et potentialiser le risque d'acidose lactique avec la metformine.<br /><br />
                          <strong>Alternatives recommandées :</strong><br />
                          • Paracétamol 1g x3/jour (première intention)<br />
                          • Application locale de diclofénac gel si douleurs localisées<br /><br />
                          <strong>Si AINS nécessaire :</strong> Surveillance fonction rénale + glycémie renforcée
                        </p>
                        <p className="text-xs opacity-70 mt-1">14:36</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Posez votre question pharmaceutique..."
                      className="flex-1"
                      disabled
                    />
                    <Button size="icon" disabled>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Historique limité aux 50 derniers messages
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>;
};
export default DwaIASection;