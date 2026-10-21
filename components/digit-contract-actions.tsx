'use client';

import { Button } from '@/components/ui/button';
import { DIGIT_CONTRACT_GROUPS, type DigitContractType } from '@/lib/types';
import type { Direction } from '@/lib/types';

const CONTRACT_LABELS: Record<DigitContractType, string> = {
  OVER: 'Over',
  UNDER: 'Under',
  EVEN: 'Even',
  ODD: 'Odd',
  MATCH: 'Matches',
  DIFFER: 'Differs',
};

export function DigitContractActions({
  selectedContract,
  disabled,
  onBuy,
}: {
  selectedContract: DigitContractType;
  disabled: boolean;
  onBuy: (contract: DigitContractType) => void;
}) {
  const contracts = DIGIT_CONTRACT_GROUPS.find(group => group.contracts.includes(selectedContract))?.contracts
    ?? DIGIT_CONTRACT_GROUPS[0].contracts;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 right-3 z-[70] grid grid-cols-2 gap-2 lg:static lg:z-auto lg:gap-2">
      {contracts.map((contract, index) => (
        <Button
          key={contract}
          type="button"
          size="lg"
          disabled={disabled}
          className={index === 0
            ? 'h-12 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700'
            : 'h-12 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700'}
          onClick={() => onBuy(contract)}
        >
          {CONTRACT_LABELS[contract]}
        </Button>
      ))}
    </div>
  );
}

export function RiseFallActions({
  disabled,
  onBuy,
  labels,
}: {
  disabled: boolean;
  onBuy: (direction: Direction) => void;
  labels?: { rise: string; fall: string };
}) {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 right-3 z-[70] grid grid-cols-2 gap-2 lg:static lg:z-auto lg:gap-2">
      <Button
        type="button"
        size="lg"
        disabled={disabled}
        className="h-12 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
        onClick={() => onBuy('CALL')}
      >
        {labels?.rise ?? 'Rise'}
      </Button>
      <Button
        type="button"
        size="lg"
        disabled={disabled}
        className="h-12 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700"
        onClick={() => onBuy('PUT')}
      >
        {labels?.fall ?? 'Fall'}
      </Button>
    </div>
  );
}