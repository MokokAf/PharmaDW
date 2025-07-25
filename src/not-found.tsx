import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Page non trouvée</CardTitle>
            <CardDescription className="mt-2">
              La page que vous recherchez n'existe pas ou a été déplacée.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/medicaments">
                <Search className="w-4 h-4 mr-2" />
                Rechercher des médicaments
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}