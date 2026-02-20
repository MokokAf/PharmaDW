"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Stethoscope, Bot, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const EspacePharmacienContent = () => {
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoAccess = async () => {
    try {
      await login("demo@pharmadw.ma", "demo123");
      router.push("/espace-pharmaciens/dashboard");
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Espace Pharmaciens
          </h1>
          <p className="text-muted-foreground">
            Votre espace professionnel avec assistant IA pour la vérification des interactions médicamenteuses.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-3 text-left">
          {[
            { icon: Bot, text: "Assistant IA pour interactions médicamenteuses" },
            { icon: Shield, text: "Bases de données médicales validées" },
            { icon: Clock, text: "Contexte patient personnalisé" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
              <f.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-foreground">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Bientôt disponible
        </div>

        {/* Hidden demo access — visible on hover */}
        <div>
          <button
            onClick={handleDemoAccess}
            className="text-xs text-muted-foreground/0 hover:text-muted-foreground/80 transition-colors duration-300 cursor-default hover:cursor-pointer"
          >
            Accès demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EspacePharmaciensPage() {
  return (
    <AuthProvider>
      <EspacePharmacienContent />
    </AuthProvider>
  );
}
