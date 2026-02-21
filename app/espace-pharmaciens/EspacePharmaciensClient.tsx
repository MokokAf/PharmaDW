'use client'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function useTripleTap(callback: () => void, delay = 500) {
  const taps = useRef<number[]>([])

  return useCallback(() => {
    const now = Date.now()
    taps.current = [...taps.current.filter((tap) => now - tap < delay), now]

    if (taps.current.length >= 3) {
      taps.current = []
      callback()
    }
  }, [callback, delay])
}

const features = [
  {
    icon: Bot,
    title: 'Assistant IA',
    desc: 'Verification instantanee des interactions medicamenteuses via intelligence artificielle.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Shield,
    title: 'Donnees validees',
    desc: 'Sources Micromedex, Cerner Multum et ASHP. Mises a jour regulieres.',
    color: 'bg-secondary/20 text-secondary-foreground',
  },
  {
    icon: Activity,
    title: 'Contexte patient',
    desc: 'Prise en compte de l age, grossesse, fonction renale et comorbidites.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Zap,
    title: 'Triage colore',
    desc: 'Resultats clairs: vert, ambre ou rouge avec niveaux de severite.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: BookOpen,
    title: 'Protocoles',
    desc: 'Acces aux protocoles et references pharmacologiques essentielles.',
    color: 'bg-secondary/20 text-secondary-foreground',
  },
  {
    icon: Clock,
    title: 'Historique',
    desc: 'Retrouvez toutes vos verifications precedentes en un clic.',
    color: 'bg-accent/10 text-accent',
  },
]

const stats = [
  { value: '30 000+', label: 'Medicaments' },
  { value: '5 000+', label: 'Interactions' },
  { value: '100%', label: 'Confidentiel' },
]

const EspacePharmacienContent = () => {
  const { login } = useAuth()
  const router = useRouter()

  const handleDemoAccess = useCallback(async () => {
    try {
      await login('demo@pharmadw.ma', 'demo123')
      router.push('/espace-pharmaciens/dashboard')
    } catch {
      // ignore
    }
  }, [login, router])

  const onTripleTap = useTripleTap(handleDemoAccess)

  return (
    <div className="flex flex-col">
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-14 md:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <button
              onClick={onTripleTap}
              aria-label="Activer le mode demo"
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
                Verifiez les interactions medicamenteuses en temps reel avec l intelligence artificielle. Concu par et pour les
                pharmaciens marocains.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="h-13 px-8 rounded-full text-base font-semibold shadow-md shadow-primary/25" disabled>
                <Lock className="h-4 w-4 mr-2" />
                Acces reserve aux pharmaciens
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-10 pt-2">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">Tout ce dont vous avez besoin</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Un espace professionnel complet pour securiser la dispensation quotidienne.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-5 rounded-2xl border border-border bg-background hover:shadow-lg hover:border-primary/20 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Bientot disponible
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Rejoignez la liste d attente</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              L espace pharmaciens sera bientot ouvert. Inscrivez-vous pour etre parmi les premiers a y acceder.
            </p>
            <Button variant="outline" size="lg" className="rounded-full" disabled>
              Etre notifie
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function EspacePharmaciensClient() {
  return (
    <AuthProvider>
      <EspacePharmacienContent />
    </AuthProvider>
  )
}
