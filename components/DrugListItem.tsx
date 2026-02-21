import { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MedDrugListItem } from '@/types/medication';
import { ChevronRight } from 'lucide-react';

interface DrugListItemProps {
  drug: MedDrugListItem;
  style?: React.CSSProperties;
}

export const DrugListItem = memo(({ drug, style }: DrugListItemProps) => {
  return (
    <div style={style} className="px-0 overflow-hidden">
      <Link
        href={`/medicaments/${drug.id}`}
        className="flex items-center gap-3 px-4 py-3 h-full border-b border-border hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-foreground truncate">
              {drug.name}
            </span>
            {(drug['@type'] === 'MedicalDevice' || drug.productType === 'MedicalDevice') && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                DM
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {[drug.strength, drug.dosageForm, drug.manufacturer].filter(Boolean).join(' · ')}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Link>
    </div>
  );
});

DrugListItem.displayName = 'DrugListItem';
