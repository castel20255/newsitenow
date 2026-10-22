'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DigitPredictionButton({
  digit,
  percentage,
  selected,
  highest,
  lowest,
  onSelect,
}: {
  digit: number;
  percentage: number;
  selected: boolean;
  highest: boolean;
  lowest: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      aria-label={`Select digit ${digit}, ${percentage.toFixed(1)} percent${highest ? ', highest frequency' : ''}${lowest ? ', lowest frequency' : ''}`}
      className={cn(
        'h-12 flex-col gap-0.5 rounded-xl border text-sm font-semibold tabular-nums',
        selected
          ? 'border-[#0C1B2A] bg-[#0C1B2A] text-white hover:bg-[#0C1B2A]/90 hover:text-white'
          : 'bg-background',
        highest && 'border-2 !border-emerald-500',
        lowest && 'digit-lowest-pulse border-2 !border-[#9F0409]'
      )}
      onClick={onSelect}
    >
      <span>{digit}</span>
      <span className={cn('text-[9px]', selected ? 'text-white/80' : 'text-muted-foreground')}>
        {percentage.toFixed(1)}%
      </span>
    </Button>
  );
}