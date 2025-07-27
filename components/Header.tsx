'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Home, Newspaper, Mail, Users, Building2, Pill } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetOverlay,
} from "@/components/ui/sheet";
import Link from "next/link";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Médicaments", href: "/medicaments", icon: Pill },
    { label: "Actualités", href: "#actualites", icon: Newspaper },
    { label: "Contact", href: "#contact", icon: Mail },
    { label: "Qui sommes-nous", href: "#about", icon: Users },
    { label: "Espace Pharmaciens", href: "/espace-pharmaciens", icon: Building2 },
  ];

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl text-primary font-bold">
              Dwaia.ma
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems
              .filter(item => !item.href.startsWith("#"))
              .map((item, idx) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <a
                    key={idx}
                    href={item.href}
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                )
              )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>

            {/* only show hamburger when closed */}
            {!isOpen && (
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            )}

            {/* dimmed backdrop */}
            <SheetOverlay className="bg-black/30 backdrop-blur-sm transition-opacity duration-200 ease-in-out" />

            <SheetContent
              side="right"
              className="w-80 p-6 transition-transform duration-300 ease-in-out"
            >
              {/* we removed the manual <SheetClose>; the built-in X stays */}
              <h2 className="text-lg font-semibold mb-8">Menu</h2>

              <nav className="space-y-4">
                {navItems
                  .filter(item => !item.href.startsWith("#"))
                  .map((item, idx) =>
                    item.href.startsWith("/") ? (
                      <Link
                        key={idx}
                        href={item.href}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <a
                        key={idx}
                        href={item.href}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </a>
                    )
                  )}
              </nav>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
};

export default Header;
