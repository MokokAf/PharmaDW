"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

/**
 * Renders the global site Header on every page **except**
 * pages under "/espace-pharmaciens" (which have their own layout).
 */
export default function SiteHeader() {
  const pathname = usePathname();
  // Hide header on the pharmacists dashboard pages
  if (pathname?.startsWith("/espace-pharmaciens")) {
    return null;
  }
  return <Header />;
}
