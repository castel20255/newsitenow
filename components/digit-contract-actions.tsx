'use client';

import { Button } from '@/components/ui/button';
import { DIGIT_CONTRACT_GROUPS, type DigitContractType } from '@/lib/types';

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
    <div className="max-lg:fixed max-lg:bottom-[calc(env(safe-area-inset-bottom)+5rem)] max-lg:left-3 max-lg:right-3 max-lg:z-[70] max-lg:grid max-lg:grid-cols-2 max-lg:gap-2 lg:hidden">
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