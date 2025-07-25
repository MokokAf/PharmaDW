import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDrugBySlug } from "@/lib/drugService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, Building2, Package, DollarSign } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ReactMarkdown from 'react-markdown';

function InfoField({ label, value }: { label: string; value?: string | string[] }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  );
}

export default function MedicamentDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: drug, isLoading, error } = useQuery({
    queryKey: ['drug', slug],
    queryFn: () => getDrugBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!slug) {
    return <Navigate to="/medicaments" replace />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !drug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Médicament non trouvé. <a href="/medicaments" className="underline">Retour à la liste</a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": drug["@type"],
    "name": drug.name,
    "description": drug.description,
    "activeIngredient": drug.activeIngredient,
    "dosageForm": drug.dosageForm,
    "strength": drug.strength,
    "manufacturer": drug.manufacturer,
    "price": drug.price ? {
      "@type": "Offer",
      "priceCurrency": drug.price.currency,
      "price": drug.price.public || drug.price.hospital
    } : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/medicaments">Médicaments</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{drug.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">{drug.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={drug.productType === 'Drug' ? 'default' : 'secondary'}>
                    {drug.productType === 'Drug' ? 'Médicament' : 'Dispositif médical'}
                  </Badge>
                  {drug.status && (
                    <Badge variant="outline">{drug.status}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Pill className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {drug.dosageForm && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Forme</p>
                  <p className="text-sm text-muted-foreground">{drug.dosageForm}</p>
                </div>
              </div>
            )}
            {drug.strength && (
              <div className="flex items-center space-x-2">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dosage</p>
                  <p className="text-sm text-muted-foreground">{drug.strength}</p>
                </div>
              </div>
            )}
            {drug.manufacturer && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fabricant</p>
                  <p className="text-sm text-muted-foreground">{drug.manufacturer}</p>
                </div>
              </div>
            )}
            {drug.price && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Prix</p>
                  <p className="text-sm text-muted-foreground">
                    {drug.price.public ? `${drug.price.public} ${drug.price.currency}` : 
                     drug.price.hospital ? `${drug.price.hospital} ${drug.price.currency}` : 
                     'Prix non disponible'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <Tabs defaultValue="indications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="indications">Indications</TabsTrigger>
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="prix">Prix</TabsTrigger>
          </TabsList>
          
          <TabsContent value="indications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Description et indications</CardTitle>
                <CardDescription>
                  Informations détaillées sur l'utilisation et les indications du médicament
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{drug.description}</ReactMarkdown>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="informations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Détails techniques et administratifs
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <InfoField label="Principe(s) actif(s)" value={drug.activeIngredient} />
                <InfoField label="Forme pharmaceutique" value={drug.dosageForm} />
                <InfoField label="Dosage" value={drug.strength} />
                <InfoField label="Présentation" value={drug.presentation} />
                <InfoField label="Classe thérapeutique" value={drug.therapeuticClass} />
                <InfoField label="Code ATC" value={drug.atcCode} />
                <InfoField label="Statut" value={drug.status} />
                <InfoField label="Fabricant" value={drug.manufacturer} />
              </CardContent>
            </Card>
            
            {drug.table && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations complémentaires</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{drug.table}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="prix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations tarifaires</CardTitle>
                <CardDescription>
                  Prix et remboursement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drug.price ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {drug.price.public && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Prix public</h4>
                        <p className="text-2xl font-bold text-primary">
                          {drug.price.public} {drug.price.currency}
                        </p>
                      </div>
                    )}
                    {drug.price.hospital && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Prix hospitalier</h4>
                        <p className="text-2xl font-bold text-primary">
                          {drug.price.hospital} {drug.price.currency}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Prix non disponible pour ce médicament.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}