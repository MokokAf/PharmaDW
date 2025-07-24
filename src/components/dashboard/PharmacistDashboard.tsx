import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  size="sm"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Accueil
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Tableau de Bord Pharmacien</h1>
                  <p className="text-muted-foreground">
                    Bienvenue, {user?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                  <Badge variant={user?.provider === 'google' ? 'default' : 'secondary'}>
                    {user?.provider === 'google' ? 'Google' : 'Email'}
                  </Badge>
                </div>
                <Button variant="outline" onClick={logout} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex w-full">
          <PharmacistSidebar />
          
          <main className="flex-1 p-6">
            <ChatBot />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};