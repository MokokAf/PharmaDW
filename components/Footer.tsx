import { Pill } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md pharma-gradient flex items-center justify-center">
              <Pill className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              Dwa<span className="text-accent font-semibold">IA</span> © {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a href="#" className="inline-flex items-center min-h-11 px-3 rounded-md hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Conditions d&apos;utilisation
            </a>
            <a href="#" className="inline-flex items-center min-h-11 px-3 rounded-md hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
