'use client'

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatBot, ChatBotHandle } from './ChatBot';
import { PharmacistSidebar } from './PharmacistSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const PharmacistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const chatRef = useRef<ChatBotHandle>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <PharmacistSidebar
          onGoDashboard={() => router.push('/espace-pharmaciens/dashboard')}
          onGoInteractions={() => chatRef.current?.focusInteractions()}
          onGoHistory={() => chatRef.current?.showHistory()}
          onOpenAccount={() => router.push('/espace-pharmaciens/dashboard#compte')}
          onLogout={logout}
        />

        <main className="transition-[margin-left] duration-200 ease-linear ml-0 md:ml-[var(--sidebar-width)]">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-semibold">DwaIA 2.0</span>
          </div>

          {/* Demo banner */}
          <div className="mx-4 mt-3 md:mt-4 mb-3 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-1.5 text-xs text-amber-600 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Mode demo — données non persistantes</span>
          </div>

          {/* ChatBot — main content */}
          <div className="max-w-3xl mx-auto px-4 pb-8">
            <ChatBot ref={chatRef} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
