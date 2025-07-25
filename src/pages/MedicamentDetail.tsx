import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getDrugBySlug } from '@/lib/drugService';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, Building2, Pill, CreditCard, Calendar, Hash, Beaker } from 'lucide-react';

export default function MedicamentDetail() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: drug, isLoading, error } = useQuery({
    queryKey: ['drug', slug],
    queryFn: () => getDrugBySlug(slug!),
    enabled: !!slug,
  });

  // Inject JSON-LD structured data
  const jsonLd = drug ? {
    "@context": "https://schema.org",
    ...drug
  } : null;

  if (!slug) {
    return <Navigate to="/medicaments" replace />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du médicament. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!drug) {
    return <Navigate to="/medicaments" replace />;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumb */}
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
        <Card className="bg-gradient-subtle border-0 shadow-medium">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-3xl">{drug.name}</CardTitle>
                  {drug['@type'] === 'MedicalDevice' && (
                    <Badge variant="secondary" className="bg-trust text-trust-foreground">
                      Dispositif médical
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {drug.dosageForm && (
                    <div className="flex items-center gap-1">
                      <Pill className="h-4 w-4" />
                      <span>{drug.dosageForm}</span>
                    </div>
                  )}
                  {drug.strength && (
                    <div className="flex items-center gap-1">
                      <Beaker className="h-4 w-4" />
                      <span>{drug.strength}</span>
                    </div>
                  )}
                  {drug.manufacturer && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{drug.manufacturer}</span>
                    </div>
                  )}
                </div>
              </div>

              {drug.price && (
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-medium">Prix</span>
                    </div>
                    {drug.price.public && (
                      <div className="text-lg font-bold text-primary">
                        {drug.price.public.toFixed(2)} MAD
                      </div>
                    )}
                    {drug.price.hospital && (
                      <div className="text-sm text-muted-foreground">
                        Hôpital: {drug.price.hospital.toFixed(2)} MAD
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="indications" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="indications">Indications</TabsTrigger>
            <TabsTrigger value="infos">Informations</TabsTrigger>
            <TabsTrigger value="prix">Prix</TabsTrigger>
          </TabsList>

          <TabsContent value="indications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Description et indications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{drug.description}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoField 
                      label="Principe(s) actif(s)" 
                      value={drug.activeIngredient?.join(', ') || 'Non spécifié'} 
                    />
                    <InfoField label="Forme galénique" value={drug.dosageForm} />
                    <InfoField label="Dosage" value={drug.strength} />
                    <InfoField label="Présentation" value={drug.presentation} />
                    <InfoField label="Laboratoire" value={drug.manufacturer} />
                  </div>
                  
                  <div className="space-y-4">
                    <InfoField 
                      label="Classe(s) thérapeutique(s)" 
                      value={drug.therapeuticClass?.join(', ') || 'Non spécifié'} 
                    />
                    <InfoField label="Code ATC" value={drug.atcCode} />
                    <InfoField label="Statut" value={drug.status} />
                    <InfoField label="Tableau" value={drug.table} />
                    <InfoField 
                      label="Dernière mise à jour" 
                      value={drug.updatedAt ? new Date(drug.updatedAt).toLocaleDateString('fr-FR') : undefined} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations tarifaires</CardTitle>
                <CardDescription>
                  Prix en dirhams marocains (MAD)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drug.price ? (
                  <div className="space-y-4">
                    {drug.price.public && (
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                        <span className="font-medium">Prix public</span>
                        <span className="text-lg font-bold text-primary">
                          {drug.price.public.toFixed(2)} MAD
                        </span>
                      </div>
                    )}
                    
                    {drug.price.hospital && (
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                        <span className="font-medium">Prix hospitalier</span>
                        <span className="text-lg font-bold text-trust">
                          {drug.price.hospital.toFixed(2)} MAD
                        </span>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground mt-4">
                      <p>* Les prix peuvent varier selon les pharmacies et sont susceptibles de modification.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-2" />
                    <p>Informations tarifaires non disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Helper component for info fields
function InfoField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground mt-1">{value}</dd>
    </div>
  );
}