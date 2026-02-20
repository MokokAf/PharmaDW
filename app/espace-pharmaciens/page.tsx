"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";
import {
  Stethoscope,
  Bot,
  Shield,
  Clock,
  Activity,
  BookOpen,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Hidden demo: triple-tap the stethoscope icon to enter demo mode   */
/* ------------------------------------------------------------------ */
function useTripleTap(callback: () => void, delay = 500) {
  const taps = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < delay), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      callback();
    }
  }, [callback, delay]);
}

/* ------------------------------------------------------------------ */
/*  Feature card data                                                  */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Bot,
    title: "Assistant IA",
    desc: "Vérification instantanée des interactions médicamenteuses via intelligence artificielle.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Shield,
    title: "Données validées",
    desc: "Sources Micromedex, Cerner Multum et ASHP. Mises à jour régulières.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Activity,
    title: "Contexte patient",
    desc: "Prise en compte de l\u2019âge, grossesse, fonction rénale et comorbidités.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: Zap,
    title: "Triage coloré",
    desc: "Résultats clairs : vert, ambre ou rouge avec niveaux de sévérité.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: BookOpen,
    title: "Protocoles",
    desc: "Accès aux protocoles et références pharmacologiques essentielles.",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    icon: Clock,
    title: "Historique",
    desc: "Retrouvez toutes vos vérifications précédentes en un clic.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

/* ------------------------------------------------------------------ */
/*  Stat pills                                                         */
/* ------------------------------------------------------------------ */
const stats = [
  { value: "30 000+", label: "Médicaments" },
  { value: "5 000+", label: "Interactions" },
  { value: "100%", label: "Confidentiel" },
];

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */
const EspacePharmacienContent = () => {
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoAccess = useCallback(async () => {
    try {
      await login("demo@pharmadw.ma", "demo123");
      router.push("/espace-pharmaciens/dashboard");
    } catch {
      // ignore
    }
  }, [login, router]);

  const onTripleTap = useTripleTap(handleDemoAccess);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Icon — triple-tap to access demo */}
            <button
              onClick={onTripleTap}
              aria-hidden
              className="mx-auto w-20 h-20 rounded-3xl pharma-gradient flex items-center justify-center shadow-lg shadow-primary/20 focus:outline-none"
            >
              <Stethoscope className="h-10 w-10 text-white" />
            </button>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
                Votre assistant
                <br />
                <span className="text-primary">pharmaceutique IA</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Vérifiez les interactions médicamenteuses en temps réel avec
                l&apos;intelligence artificielle. Conçu par et pour les
                pharmaciens marocains.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-13 px-8 rounded-full text-base font-semibold shadow-md shadow-primary/25"
                disabled
              >
                <Lock className="h-4 w-4 mr-2" />
                Accès réservé aux pharmaciens
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 md:gap-10 pt-2">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Un espace professionnel complet pour sécuriser la dispensation
            quotidienne.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-5 rounded-2xl border border-border bg-background hover:shadow-lg hover:border-primary/20 transition-all duration-200"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="bg-surface mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Bientôt disponible
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              Rejoignez la liste d&apos;attente
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              L&apos;espace pharmaciens sera bientôt ouvert. Inscrivez-vous pour
              être parmi les premiers à y accéder.
            </p>
            <Button variant="outline" size="lg" className="rounded-full" disabled>
              Être notifié
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
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
