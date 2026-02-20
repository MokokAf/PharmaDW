'use client'

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatBot, ChatBotHandle } from './ChatBot';
import { PharmacistSidebar } from './PharmacistSidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertTriangle,
  Pill,
  Activity,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Quick-action cards for the dashboard home                          */
/* ------------------------------------------------------------------ */
const quickActions = [
  {
    icon: Pill,
    label: 'Nouvelle vérification',
    desc: 'Checker une interaction',
    color: 'bg-emerald-500/10 text-emerald-600',
    action: 'interactions' as const,
  },
  {
    icon: Clock,
    label: 'Historique',
    desc: 'Voir les checks précédents',
    color: 'bg-blue-500/10 text-blue-600',
    action: 'history' as const,
  },
  {
    icon: TrendingUp,
    label: 'Statistiques',
    desc: 'Résumé de votre activité',
    color: 'bg-violet-500/10 text-violet-600',
    action: 'stats' as const,
  },
];

export const PharmacistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const chatRef = useRef<ChatBotHandle>(null);

  const [view, setView] = React.useState<'home' | 'assistant'>('assistant');

  const handleQuickAction = (action: string) => {
    if (action === 'interactions') {
      setView('assistant');
      setTimeout(() => chatRef.current?.focusInteractions(), 100);
    } else if (action === 'history') {
      chatRef.current?.showHistory();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <PharmacistSidebar
          onGoDashboard={() => setView('home')}
          onGoInteractions={() => {
            setView('assistant');
            setTimeout(() => chatRef.current?.focusInteractions(), 100);
          }}
          onGoHistory={() => chatRef.current?.showHistory()}
          onOpenAccount={() =>
            router.push('/espace-pharmaciens/dashboard#compte')
          }
          onLogout={logout}
        />

        <main className="transition-[margin-left] duration-200 ease-linear ml-0 md:ml-[var(--sidebar-width)]">
          {/* ── Mobile top bar ─────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 md:hidden">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg pharma-gradient flex items-center justify-center">
                  <Pill className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold">DwaIA</span>
              </div>
            </div>
            {/* Tab toggle on mobile */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setView('home')}
                className={`px-4 min-h-11 text-xs font-medium rounded-md transition-colors ${
                  view === 'home'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => setView('assistant')}
                className={`px-4 min-h-11 text-xs font-medium rounded-md transition-colors ${
                  view === 'assistant'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Assistant
              </button>
            </div>
          </div>

          {/* ── Demo banner ────────────────────────────────────── */}
          <div className="mx-4 mt-3 md:mx-6 md:mt-4 mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Mode démo</strong> — Les données ne sont pas
                persistantes. Explorez librement l&apos;interface.
              </span>
            </div>
          </div>

          {/* ── Content ────────────────────────────────────────── */}
          <div className="px-4 md:px-6 pb-10">
            {view === 'home' ? (
              /* ── Dashboard home ─────────────────────────────── */
              <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                {/* Welcome */}
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Bonjour, Dr.{' '}
                    {user?.name
                      ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                      : 'Pharmacien'}{' '}
                    <span className="inline-block animate-bounce">
                      <Activity className="h-6 w-6 text-primary inline" />
                    </span>
                  </h1>
                  <p className="text-muted-foreground">
                    Bienvenue dans votre espace professionnel DwaIA.
                  </p>
                </div>

                {/* Quick actions */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => handleQuickAction(qa.action)}
                      className="group text-left p-5 rounded-2xl border border-border bg-background hover:shadow-lg hover:border-primary/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${qa.color}`}
                      >
                        <qa.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-0.5">
                        {qa.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {qa.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* CTA to assistant */}
                <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl pharma-gradient flex items-center justify-center mx-auto shadow-md shadow-primary/20">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Prêt à vérifier une interaction ?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    L&apos;assistant DwaIA utilise l&apos;IA pour analyser les
                    interactions médicamenteuses avec le contexte patient.
                  </p>
                  <Button
                    onClick={() => {
                      setView('assistant');
                      setTimeout(
                        () => chatRef.current?.focusInteractions(),
                        100
                      );
                    }}
                    size="lg"
                    className="rounded-full px-8"
                  >
                    Ouvrir l&apos;assistant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Assistant view ─────────────────────────────── */
              <div className="max-w-3xl mx-auto animate-fade-in">
                <ChatBot ref={chatRef} />
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
