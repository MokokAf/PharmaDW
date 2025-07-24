import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Newspaper, Mail, Users, Building2, Pill } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{
    label: "Accueil",
    href: "/",
    icon: Home
  }, {
    label: "Médicaments",
    href: "/medicaments",
    icon: Pill
  }, {
    label: "Actualités",
    href: "#actualites",
    icon: Newspaper
  }, {
    label: "Contact",
    href: "#contact",
    icon: Mail
  }, {
    label: "Qui sommes-nous",
    href: "#about",
    icon: Users
  }, {
    label: "Espace Pharmaciens",
    href: "/espace-pharmaciens",
    icon: Building2
  }];
  return <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            
            <div>
              <h1 className="text-xl text-primary font-light">Dwaia.ma</h1>
              
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => item.href.startsWith('/') ? <Link key={index} to={item.href} className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link> : <a key={index} href={item.href} className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>)}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="space-y-4">
                {navItems.map((item, index) => item.href.startsWith('/') ? <Link key={index} to={item.href} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsOpen(false)}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link> : <a key={index} href={item.href} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsOpen(false)}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </a>)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
};
export default Header;