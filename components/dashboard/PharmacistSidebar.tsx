'use client'

import React, { useState } from 'react';
import { LayoutGrid, Pill, History, BookOpen, ClipboardCheck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

type Props = {
  onGoDashboard?: () => void;
  onGoInteractions?: () => void;
  onGoHistory?: () => void;
  onOpenAccount?: () => void;
  onLogout?: () => void;
};

const navItems = [
  { id: 'dashboard' as const, icon: LayoutGrid, label: 'Tableau de bord', group: 'nav' },
  { id: 'interactions' as const, icon: Pill, label: 'Interactions', group: 'nav' },
  { id: 'historique' as const, icon: History, label: 'Historique', group: 'nav' },
  { id: 'references' as const, icon: BookOpen, label: 'Références', group: 'resources' },
  { id: 'protocoles' as const, icon: ClipboardCheck, label: 'Protocoles', group: 'resources' },
  { id: 'compte' as const, icon: User, label: 'Mon compte', group: 'account' },
];

type NavId = typeof navItems[number]['id'];

export function PharmacistSidebar({ onGoDashboard, onGoInteractions, onGoHistory, onOpenAccount, onLogout }: Props) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [active, setActive] = useState<NavId>('dashboard');

  const handlers: Record<NavId, (() => void) | undefined> = {
    dashboard: onGoDashboard,
    interactions: onGoInteractions,
    historique: onGoHistory,
    references: undefined,
    protocoles: undefined,
    compte: onOpenAccount,
  };

  const renderItem = (item: typeof navItems[number]) => (
    <SidebarMenuItem key={item.id}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 rounded-lg transition-colors",
          isCollapsed ? "px-2" : "px-3 py-2.5",
          active === item.id
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        size={isCollapsed ? 'icon' : 'default'}
        onClick={() => { setActive(item.id); handlers[item.id]?.(); }}
        aria-current={active === item.id ? 'page' : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="text-sm">{item.label}</span>}
      </Button>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="fixed inset-y-0 left-0 z-40 h-svh border-r border-border bg-background"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg pharma-gradient flex items-center justify-center shrink-0">
            <Pill className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-sm">Dwaia<span className="text-primary">.ma</span></span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full px-2">
        {/* Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-1">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.filter(i => i.group === 'nav').map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ressources */}
        <SidebarGroup className="mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-1">
              Ressources
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.filter(i => i.group === 'resources').map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Compte — bottom */}
        <SidebarGroup className="mt-auto pb-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-1">
              Compte
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.filter(i => i.group === 'account').map(renderItem)}
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    isCollapsed ? "px-2" : "px-3 py-2.5"
                  )}
                  size={isCollapsed ? 'icon' : 'default'}
                  onClick={() => onLogout?.()}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="text-sm">Déconnexion</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
