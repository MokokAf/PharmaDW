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
        {/* Sidebar — hidden on mobile, ChatBot takes full screen */}
        <div className="hidden md:block">
          <PharmacistSidebar
            onGoDashboard={() => router.push('/espace-pharmaciens/dashboard')}
            onGoInteractions={() => chatRef.current?.focusInteractions()}
            onGoHistory={() => chatRef.current?.showHistory()}
            onOpenAccount={() => router.push('/espace-pharmaciens/dashboard#compte')}
            onLogout={logout}
          />
        </div>

        <main className="px-0 pt-0 pb-0 md:px-4 md:pt-2 md:pb-4 transition-[margin-left] duration-200 ease-linear ml-0 md:ml-[var(--sidebar-width)]">
          {/* Demo banner — discreet */}
          <div className="mx-3 mt-2 md:mx-0 mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Mode demo — données non persistantes</span>
          </div>

          {/* Mobile top bar */}
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm border-b border-border/50 px-3 py-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">DwaIA 2.0</span>
          </div>

          {/* ChatBot — fullscreen on mobile */}
          <div className="md:pt-2">
            <ChatBot ref={chatRef} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
