'use client';

import { Button } from '@/components/ui/button';
import { DIGIT_CONTRACT_GROUPS, type DigitContractType } from '@/lib/types';
import type { Direction } from '@/lib/types';
import { getDigitPayoutAmount } from '@/lib/digit-payout';

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
  selectedDigit,
  stake,
  disabled,
  onBuy,
}: {
  selectedContract: DigitContractType;
  selectedDigit: number;
  stake: string;
  disabled: boolean;
  onBuy: (contract: DigitContractType) => void;
}) {
  const contracts = DIGIT_CONTRACT_GROUPS.find(group => group.contracts.includes(selectedContract))?.contracts
    ?? DIGIT_CONTRACT_GROUPS[0].contracts;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 right-3 z-[70] grid grid-cols-2 gap-2 lg:static lg:z-auto lg:gap-2">
      {contracts.map((contract, index) => {
        const payout = getDigitPayoutAmount(contract, selectedDigit, Number(stake));
        return (
          <Button
            key={contract}
            type="button"
            size="lg"
            disabled={disabled || payout === null}
            aria-label={`${CONTRACT_LABELS[contract]}${payout === null ? ` unavailable for digit ${selectedDigit}` : `, receive $${payout.toFixed(2)}`}`}
            className={index === 0
              ? 'h-12 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700'
              : 'h-12 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700'}
            onClick={() => onBuy(contract)}
          >
            <span className="flex flex-col items-center leading-tight">
              <span>{CONTRACT_LABELS[contract]}</span>
              <span className="text-[10px] font-normal opacity-90">
                {payout === null ? `Unavailable at ${selectedDigit}` : `Receive $${payout.toFixed(2)}`}
              </span>
            </span>
          </Button>
        );
      })}
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