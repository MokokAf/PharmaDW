'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Pill, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Pharmacies", href: "/pharmacies-de-garde", icon: MapPin },
  { label: "Médicaments", href: "/medicaments", icon: Pill },
  { label: "Espace Pro", href: "/espace-pharmaciens", icon: Stethoscope },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on dashboard pages
  if (pathname.includes("/dashboard")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 md:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-11 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn(
                "text-[11px] leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
