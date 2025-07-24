import React from 'react';
import { User, Mail, Shield, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

export function PharmacistSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
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