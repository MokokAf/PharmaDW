'use client'

import React, { useState } from 'react';
import {
  LayoutGrid,
  Pill,
  History,
  BookOpen,
  ClipboardCheck,
  User,
  LogOut,
  Bot,
} from 'lucide-react';
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

const navGroups = [
  {
    label: 'Navigation',
    items: [
      { id: 'dashboard', icon: LayoutGrid, label: 'Tableau de bord' },
      { id: 'interactions', icon: Pill, label: 'Interactions' },
      { id: 'historique', icon: History, label: 'Historique' },
    ],
  },
  {
    label: 'Ressources',
    items: [
      { id: 'references', icon: BookOpen, label: 'Références' },
      { id: 'protocoles', icon: ClipboardCheck, label: 'Protocoles' },
    ],
  },
];

type NavId = 'dashboard' | 'interactions' | 'historique' | 'references' | 'protocoles' | 'compte';

export function PharmacistSidebar({
  onGoDashboard,
  onGoInteractions,
  onGoHistory,
  onOpenAccount,
  onLogout,
}: Props) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [active, setActive] = useState<NavId>('interactions');

  const handlers: Record<NavId, (() => void) | undefined> = {
    dashboard: onGoDashboard,
    interactions: onGoInteractions,
    historique: onGoHistory,
    references: undefined,
    protocoles: undefined,
    compte: onOpenAccount,
  };

  const handleClick = (id: NavId) => {
    setActive(id);
    handlers[id]?.();
  };

  return (
    <Sidebar
      collapsible="icon"
      className="fixed inset-y-0 left-0 z-40 h-svh"
    >
      {/* ── Logo header ──────────────────────────────────────── */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl pharma-gradient flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">
                DwaIA<span className="text-primary">.ma</span>
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-tight">
                Espace pharmacien
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ── Nav groups ───────────────────────────────────────── */}
      <SidebarContent className="flex flex-col flex-1 px-2 py-3 custom-scrollbar overflow-y-auto">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3 mb-1.5">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl transition-all duration-150',
                        isCollapsed ? 'justify-center min-h-11 px-2.5' : 'px-3 min-h-11',
                        active === item.id
                          ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm'
                          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
                      )}
                      onClick={() => handleClick(item.id as NavId)}
                      aria-current={active === item.id ? 'page' : undefined}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active === item.id
                            ? 'text-sidebar-primary'
                            : 'text-sidebar-foreground/60'
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-[13px]">{item.label}</span>
                      )}
                    </button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer: account & logout ─────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className="space-y-0.5">
          <SidebarMenuItem>
            <button
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-all duration-150',
                isCollapsed ? 'justify-center min-h-11 px-2.5' : 'px-3 min-h-11',
                active === 'compte'
                  ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
              )}
              onClick={() => handleClick('compte')}
            >
              <User className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && (
                <span className="text-[13px]">Mon compte</span>
              )}
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-all duration-150',
                isCollapsed ? 'justify-center min-h-11 px-2.5' : 'px-3 min-h-11',
                'text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
              )}
              onClick={() => onLogout?.()}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && (
                <span className="text-[13px]">Déconnexion</span>
              )}
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
