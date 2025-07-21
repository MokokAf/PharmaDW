import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Package, DollarSign, ArrowRight } from "lucide-react";

const NewMedicationsSection = () => {
  const medications = [
    {
      name: "SUVAS IBERMA 10 MG",
      form: "Comprimés pelliculés",
      packaging: "Boite de 10",
      price: "51.00 dhs",
      isNew: true
    },
    {
      name: "SUVAS IBERMA 10 MG",
      form: "Comprimés pelliculés", 
      packaging: "Boite de 30",
      price: "153.00 dhs",
      isNew: true
    },
    {
      name: "SUVAS IBERMA 20 MG",
      form: "Comprimés pelliculés",
      packaging: "Boite de 10", 
      price: "81.70 dhs",
      isNew: true
    },
    {
      name: "SUVAS IBERMA 20 MG",
      form: "Comprimés pelliculés",
      packaging: "Boite de 30",
      price: "244.00 dhs",
      isNew: true
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nouveaux médicaments
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez les derniers médicaments commercialisés au Maroc
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {medications.map((med, index) => (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 cursor-pointer border-border hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      {med.isNew && (
                        <Badge variant="outline" className="border-secondary text-secondary">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {med.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{med.form}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{med.packaging}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-lg font-semibold text-primary">
                        PPV: {med.price}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg">
              Voir tous les nouveaux médicaments
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewMedicationsSection;