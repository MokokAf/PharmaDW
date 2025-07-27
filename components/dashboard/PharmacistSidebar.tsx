'use client'

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, BookOpen, ArrowLeft, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';

export function PharmacistSidebar() {
  const MIN_WIDTH = 240;
  const MAX_WIDTH = 500;
  const DEFAULT_WIDTH = 320;

  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    // keep CSS variable in sync
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
  }, [width]);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      console.log('drag move', e.clientX);
      if (!dragging) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    }
    function stopDrag() {
      setDragging(false);
    }
    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', stopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [dragging]);
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const router = useRouter();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" style={{'--sidebar-width': `${width}px`} as React.CSSProperties} className="fixed inset-y-0 left-0 z-40 h-svh w-[--sidebar-width] overflow-visible bg-white shadow">
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
      
      <SidebarContent className="flex flex-col h-full">
        {/* Navigation Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Actions"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
                  size={isCollapsed ? 'icon' : 'default'}
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
        <SidebarFooter className="p-2 border-t mt-auto">
          <Button
            variant="ghost"
            className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'}`}
            size={isCollapsed ? 'icon' : 'default'}
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Retour à l'accueil</span>}
          </Button>
        </SidebarFooter>
</SidebarContent>
    {/* drag handle */}
      <div
        onMouseDown={(e) => { console.log('drag start'); e.preventDefault(); setDragging(true); }}
        className="absolute top-0 right-0 z-50 h-full w-6 bg-gray-300/60 cursor-ew-resize hover:bg-primary/40"
      />
    </Sidebar>
  );
}