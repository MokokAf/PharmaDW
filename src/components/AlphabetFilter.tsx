import { Button } from '@/components/ui/button';
import { ALPHABET } from '@/lib/drugService';
import { cn } from '@/lib/utils';

interface AlphabetFilterProps {
  selectedLetter: string;
  onLetterSelect: (letter: string) => void;
}

export function AlphabetFilter({ selectedLetter, onLetterSelect }: AlphabetFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border">
      <Button
        variant={selectedLetter === '' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onLetterSelect('')}
        className="text-xs font-medium"
      >
        Tous
      </Button>
      {ALPHABET.map((letter) => (
        <Button
          key={letter}
          variant={selectedLetter === letter ? 'default' : 'outline'}
          size="sm"
          onClick={() => onLetterSelect(letter)}
          className={cn(
            "text-xs font-medium min-w-[32px]",
            selectedLetter === letter && "bg-primary text-primary-foreground"
          )}
        >
          {letter}
        </Button>
      ))}
    </div>
  );
}