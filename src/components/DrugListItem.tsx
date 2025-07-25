import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedDrug } from '@/types/medication';
import { Building2, Pill, CreditCard } from 'lucide-react';

interface DrugListItemProps {
  drug: MedDrug;
  style?: React.CSSProperties;
}

export const DrugListItem = memo(({ drug, style }: DrugListItemProps) => {
  const displayPrice = drug.price?.public 
    ? `${drug.price.public.toFixed(2)} MAD`
    : 'Prix non disponible';

  return (
    <div style={style} className="px-2 py-1">
      <Link href={`/medicaments/${drug.id}`}>
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {drug.name}
                  </h3>
                  {drug['@type'] === 'MedicalDevice' && (
                    <Badge variant="secondary" className="text-xs">
                      Dispositif médical
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  {drug.strength && drug.dosageForm && (
                    <div className="flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      <span>{drug.strength} - {drug.dosageForm}</span>
                    </div>
                  )}
                  
                  {drug.manufacturer && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{drug.manufacturer}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <CreditCard className="h-3 w-3" />
                  <span>{displayPrice}</span>
                </div>
                {drug.price?.hospital && (
                  <div className="text-xs text-muted-foreground">
                    Hôpital: {drug.price.hospital.toFixed(2)} MAD
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
});

DrugListItem.displayName = 'DrugListItem';