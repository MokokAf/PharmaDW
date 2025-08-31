'use client'

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBot, ChatBotHandle } from './ChatBot';
import { PharmacistSidebar } from './PharmacistSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Mail, Shield, ArrowLeft, Menu } from 'lucide-react';
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
        
        <main className="px-3 pt-2 pb-4 md:p-4 transition-[margin-left] duration-200 ease-linear ml-0 md:ml-[var(--sidebar-width)]">
          {/* Mobile top bar with sidebar trigger */}
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>
          <ChatBot ref={chatRef} />
        </main>
      </div>
    </SidebarProvider>
  );
};