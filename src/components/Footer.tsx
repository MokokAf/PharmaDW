import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Home, Mail, Users, Building2, Truck, Heart, MapPin, ExternalLink, Calendar, Database } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const linkGroups = [{
    title: "Navigation",
    icon: Home,
    links: [{
      label: "Accueil",
      href: "#",
      icon: Home
    }, {
      label: "Contact",
      href: "#contact",
      icon: Mail
    }, {
      label: "Qui sommes-nous",
      href: "#about",
      icon: Users
    }]
  }, {
    title: "Professionnels",
    icon: Building2,
    links: [{
      label: "Laboratoires",
      href: "#laboratoires",
      icon: Building2
    }, {
      label: "Répartiteurs",
      href: "#repartiteurs",
      icon: Truck
    }, {
      label: "Partenaires",
      href: "#partenaires",
      icon: Heart
    }, {
      label: "Adresses utiles",
      href: "#adresses",
      icon: MapPin
    }]
  }, {
    title: "Sites externes",
    icon: ExternalLink,
    links: [{
      label: "Dwaia.ma",
      href: "#",
      external: true
    }, {
      label: "Pharmanews",
      href: "#",
      external: true
    }, {
      label: "Ministère de la santé",
      href: "#",
      external: true
    }, {
      label: "ANAM",
      href: "#",
      external: true
    }, {
      label: "CNOPS",
      href: "#",
      external: true
    }, {
      label: "RAMED",
      href: "#",
      external: true
    }, {
      label: "CNSS",
      href: "#",
      external: true
    }]
  }, {
    title: "Organismes internationaux",
    icon: ExternalLink,
    links: [{
      label: "ANSM",
      href: "#",
      external: true
    }, {
      label: "CRAT",
      href: "#",
      external: true
    }, {
      label: "HAS",
      href: "#",
      external: true
    }, {
      label: "EMA",
      href: "#",
      external: true
    }, {
      label: "FDA",
      href: "#",
      external: true
    }]
  }];
  return <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {linkGroups.map((group, index) => <div key={index}>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <group.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{group.title}</h3>
              </div>
              <ul className="space-y-3">
                {group.links.map((link, linkIndex) => <li key={linkIndex}>
                    <a href={link.href} className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors group" target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>
                      {link.icon && <link.icon className="h-4 w-4" />}
                      <span className="group-hover:underline">{link.label}</span>
                      {link.external && <ExternalLink className="h-3 w-3 opacity-50" />}
                    </a>
                  </li>)}
              </ul>
            </div>)}
        </div>

        <Separator className="mb-8" />

        {/* Stats and Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Dernière mise à jour</span>
            </div>
            <Badge variant="outline" className="text-sm">
              8 juillet 2025
            </Badge>
          </div>
          
          <div className="text-center">
            
            
          </div>
          
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Dwaia.ma</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre référence pharmaceutique
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Dwaia.ma © {currentYear} - Tous droits réservés
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary">
              Conditions d'utilisation
            </Button>
            <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary">
              Politique de confidentialité
            </Button>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;