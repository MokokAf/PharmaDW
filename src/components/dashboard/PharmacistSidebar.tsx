import React from 'react';
import { User, Mail, Shield, BookOpen, ArrowLeft, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

export function PharmacistSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-2">
          <h2 className={`font-bold ${isCollapsed ? 'text-sm' : 'text-lg'}`}>
            {isCollapsed ? 'TB' : 'Tableau de Bord'}
          </h2>
          {!isCollapsed && (
            <p className="text-sm text-muted-foreground">
              Bienvenue, {user?.name}
            </p>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Navigation Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {!isCollapsed && "Actions"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
                  size={isCollapsed ? "icon" : "default"}
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Retour à l'accueil</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
                  size={isCollapsed ? "icon" : "default"}
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Déconnexion</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Information Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {!isCollapsed && "Informations du Compte"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {!isCollapsed && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Nom:</span>
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Méthode:</span>
                  <Badge variant={user?.provider === 'google' ? 'default' : 'secondary'} className="text-xs">
                    {user?.provider === 'google' ? 'Google' : 'Email'}
                  </Badge>
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {!isCollapsed && "Ressources"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
                  size={isCollapsed ? "icon" : "default"}
                >
                  <BookOpen className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Références Professionnelles</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
                  size={isCollapsed ? "icon" : "default"}
                >
                  <Shield className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Protocoles Pharmaceutiques</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}