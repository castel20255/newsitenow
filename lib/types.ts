export type {
  ActiveSymbol,
  Tick,
  TicksHistoryResponse,
  ContractsForResponse,
  ContractInfo,
  DurationLimits,
  ProposalResponse,
  ProposalInfo,
  BuyResponse,
  BuyResult,
} from '@deriv/core';

export type { OpenPosition } from '@/hooks/use-open-positions';
export type { ClosedPosition } from '@/hooks/use-closed-positions';

export type Direction = 'CALL' | 'PUT';

export type DigitContractType = 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCH' | 'DIFFER';

export const DIGIT_CONTRACT_GROUPS: {
  label: string;
  contracts: [DigitContractType, DigitContractType];
}[] = [
  { label: 'Over/Under', contracts: ['OVER', 'UNDER'] },
  { label: 'Even/Odd', contracts: ['EVEN', 'ODD'] },
  { label: 'Matches/Differs', contracts: ['MATCH', 'DIFFER'] },
];

export type PositionFilter = 'open' | 'closed' | 'all';

export type { DurationSelectUnit, DurationOption } from '@/lib/duration-utils';
