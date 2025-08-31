'use client'

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Pill, History, BookOpen, ClipboardCheck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
type Props = {
  onGoDashboard?: () => void;
  onGoInteractions?: () => void;
  onGoHistory?: () => void;
  onOpenAccount?: () => void;
  onLogout?: () => void;
};

export function PharmacistSidebar({ onGoDashboard, onGoInteractions, onGoHistory, onOpenAccount, onLogout }: Props) {
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [active, setActive] = useState<'dashboard'|'interactions'|'historique'|'references'|'protocoles'|'compte'>('dashboard');

  return (
    <Sidebar collapsible="icon" style={{'--sidebar-width': `${width}px`} as React.CSSProperties} className="fixed inset-y-0 left-0 z-40 h-svh w-[--sidebar-width] overflow-visible bg-white shadow">
      <SidebarHeader>
        <div className="flex flex-col">
          <h2 className={`font-semibold ${isCollapsed ? 'text-sm' : 'text-base'}`}>Tableau de bord</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wide">
            {!isCollapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='dashboard' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='dashboard' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => { setActive('dashboard'); onGoDashboard?.(); }}
                  aria-current={active==='dashboard' ? 'page' : undefined}
                >
                  <LayoutGrid className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Tableau de bord</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='interactions' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='interactions' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => { setActive('interactions'); onGoInteractions?.(); }}
                >
                  <Pill className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Interactions</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='historique' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='historique' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => { setActive('historique'); onGoHistory?.(); }}
                >
                  <History className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Historique</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ressources */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wide">
            {!isCollapsed && 'Ressources'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='references' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='references' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? "icon" : "default"}
                  onClick={() => setActive('references')}
                >
                  <BookOpen className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Références professionnelles</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='protocoles' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='protocoles' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? "icon" : "default"}
                  onClick={() => setActive('protocoles')}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Protocoles pharmaceutiques</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Compte */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wide">
            {!isCollapsed && 'Compte'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`relative w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${active==='compte' ? 'font-semibold' : ''} ${!isCollapsed ? 'py-2' : ''} border-l-2 ${active==='compte' ? 'border-primary' : 'border-transparent'}`}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => { setActive('compte'); onOpenAccount?.(); }}
                >
                  <User className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Mon compte</span>}
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-4'} ${!isCollapsed ? 'py-2' : ''}`}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => onLogout?.()}
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Déconnexion</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    {/* drag handle */}
      <div
        onMouseDown={(e) => { console.log('drag start'); e.preventDefault(); setDragging(true); }}
        className="absolute top-0 right-0 z-50 h-full w-6 bg-gray-300/60 cursor-ew-resize hover:bg-primary/40"
      />
    </Sidebar>
  );
}