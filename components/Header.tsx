'use client';

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Home, MapPin, Pill, Stethoscope } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetOverlay,
} from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Pharmacies de Garde", href: "/pharmacies-de-garde", icon: MapPin },
  { label: "Médicaments", href: "/medicaments", icon: Pill },
  { label: "Espace Pharmaciens", href: "/espace-pharmaciens", icon: Stethoscope },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-background/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="w-8 h-8 rounded-lg pharma-gradient flex items-center justify-center">
              <Pill className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              Dwa<span className="text-accent font-bold">IA</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 min-h-11 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {!isOpen && (
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            )}
            <SheetOverlay className="bg-black/20 backdrop-blur-sm" />
            <SheetContent side="right" className="w-72 p-6 bg-background">
              <h2 className="text-lg font-semibold mb-6">Menu</h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 min-h-11 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
