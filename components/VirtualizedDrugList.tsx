'use client';

import { FixedSizeList as List } from 'react-window';
import { DrugListItem } from './DrugListItem';
import { MedDrug } from '@/types/medication';
import { useEffect, useRef, useState } from 'react';

interface VirtualizedDrugListProps {
  drugs: MedDrug[];
}

const ITEM_HEIGHT = 64;

export function VirtualizedDrugList({ drugs }: VirtualizedDrugListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(500);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top;
        const h = Math.max(400, window.innerHeight - top - 32);
        setHeight(h);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (drugs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-base font-medium">Aucun médicament trouvé</p>
          <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-lg border border-border overflow-hidden">
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
