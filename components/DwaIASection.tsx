'use client';

import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Lightbulb, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  { icon: MessageCircle, text: "Détection des interactions médicamenteuses" },
  { icon: Lightbulb, text: "Conseils de dispensation personnalisés" },
  { icon: Shield, text: "Conformité réglementaire" },
];

const DwaIASection = () => {
  const router = useRouter();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dwa IA 2.0</h2>
                <p className="text-sm text-muted-foreground">Assistant IA pour pharmaciens</p>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <f.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              onClick={() => router.push('/espace-pharmaciens')}
              className="w-full md:w-auto rounded-lg h-11"
            >
              <Bot className="h-4 w-4 mr-2" />
              Accéder à l&apos;assistant
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DwaIASection;
