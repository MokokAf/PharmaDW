'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBot } from './ChatBot';
import { PharmacistSidebar } from './PharmacistSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Mail, Shield, ArrowLeft, Menu } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const PharmacistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <PharmacistSidebar />
        
        <main className="p-6 transition-[margin-left] duration-200 ease-linear" style={{ marginLeft: 'var(--sidebar-width)' }}>
          <ChatBot />
        </main>
      </div>
    </SidebarProvider>
  );
};