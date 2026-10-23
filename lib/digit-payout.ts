import type { DigitContractType } from '@/lib/types';

const OVER_PAYOUT_PERCENTAGES: Record<number, number> = {
  0: 15,
  1: 26,
  2: 36,
  3: 47,
  4: 58,
  5: 69,
  6: 86,
  7: 141,
  8: 290,
};

const UNDER_PAYOUT_PERCENTAGES: Record<number, number> = {
  1: 290,
  2: 141,
  3: 86,
  4: 69,
  5: 58,
  6: 47,
  7: 36,
  8: 26,
  9: 15,
};

const FIXED_PAYOUT_PERCENTAGES: Partial<Record<DigitContractType, number>> = {
  EVEN: 87,
  ODD: 87,
  MATCH: 347.765,
  DIFFER: 19,
};

export function getDigitPayoutAmount(
  contractType: DigitContractType,
  selectedDigit: number,
  stake: number
): number | null {
  if (!Number.isFinite(stake) || stake <= 0) return null;

  const payoutPercentage = contractType === 'OVER'
    ? OVER_PAYOUT_PERCENTAGES[selectedDigit]
    : contractType === 'UNDER'
      ? UNDER_PAYOUT_PERCENTAGES[selectedDigit]
      : FIXED_PAYOUT_PERCENTAGES[contractType];

  if (payoutPercentage === undefined) return null;
  return Number((stake * (1 + payoutPercentage / 100)).toFixed(2));
}