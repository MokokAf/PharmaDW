import { FixedSizeList as List } from 'react-window';
import { DrugListItem } from './DrugListItem';
import { MedDrug } from '@/types/medication';

interface VirtualizedDrugListProps {
  drugs: MedDrug[];
  height: number;
}

const ITEM_HEIGHT = 120; // Height of each drug item in pixels

export function VirtualizedDrugList({ drugs, height }: VirtualizedDrugListProps) {
  if (drugs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Aucun médicament trouvé</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <List
        height={height}
        itemCount={drugs.length}
        itemSize={ITEM_HEIGHT}
        itemData={drugs}
        width="100%"
      >
        {({ index, style }) => (
          <DrugListItem 
            drug={drugs[index]} 
            style={style}
          />
        )}
      </List>
    </div>
  );
}