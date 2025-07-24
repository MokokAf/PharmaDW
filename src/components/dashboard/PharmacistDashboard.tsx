import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBot } from './ChatBot';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Mail, Shield, ArrowLeft } from 'lucide-react';

export const PharmacistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informations du Compte
              </CardTitle>
              <CardDescription>
                Détails de votre profil pharmacien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nom:</span>
                <span className="text-sm">{user?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Méthode:</span>
                <Badge variant={user?.provider === 'google' ? 'default' : 'secondary'}>
                  {user?.provider === 'google' ? 'Connexion Google' : 'Connexion Email'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Chat Bot */}
          <div className="lg:col-span-2">
            <ChatBot />
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Ressources Pharmaceutiques</CardTitle>
              <CardDescription>
                Accès rapide aux références professionnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Accéder aux Ressources
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formations Continues</CardTitle>
              <CardDescription>
                Modules de formation et certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Voir les Formations
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Technique</CardTitle>
              <CardDescription>
                Assistance et documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Contacter le Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};