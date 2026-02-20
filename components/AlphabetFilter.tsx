import { ALPHABET } from '@/lib/drugService';
import { cn } from '@/lib/utils';

interface AlphabetFilterProps {
  selectedLetter: string;
  onLetterSelect: (letter: string) => void;
}

export function AlphabetFilter({ selectedLetter, onLetterSelect }: AlphabetFilterProps) {
  return (
    <div className="scroll-strip gap-1.5 py-2">
      <button
        onClick={() => onLetterSelect('')}
        className={cn(
          "shrink-0 min-w-[28px] h-7 px-2 rounded-full text-xs font-medium transition-colors",
          selectedLetter === ''
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Tous
      </button>
      {ALPHABET.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterSelect(letter)}
          className={cn(
            "shrink-0 min-w-[28px] h-7 rounded-full text-xs font-medium transition-colors",
            selectedLetter === letter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
