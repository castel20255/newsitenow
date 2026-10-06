'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Localize } from '@deriv-com/translations';
import { recordDigitTrade } from '@/app/actions/digit-trading';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EndTimePicker } from '@/components/custom/end-time-picker';
import type { DerivWS, ActiveSymbol, ProposalInfo, BuyResult } from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '../lib/types';

interface TradeControlsProps {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  allowEquals: boolean;
  onAllowEqualsChange: (value: boolean) => void;
  isConnected: boolean;
  stake: string;
  onStakeChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  onDurationUnitChange: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  ws: DerivWS | null;
  activeSymbol: ActiveSymbol | null;
  proposal: ProposalInfo | null;

  onBuy: () => void;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;
  /** Whether the user is authenticated — shows the View your positions link when true. */
  isAuthenticated?: boolean;
}

export function TradeControls({
  direction,
  onDirectionChange,
  allowEquals,
  onAllowEqualsChange,
  isConnected,
  stake,
  onStakeChange,
  duration,
  onDurationChange,
  durationOptions,
  durationUnit,
  onDurationUnitChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  ws,
  activeSymbol,
  proposal,
  onBuy,
  isBuying,
  buyResult,
  buyError,
  onClearBuyResult,
  isAuthenticated,
}: TradeControlsProps) {
  const { localize } = useAppTranslations();

  useEffect(() => {
    if (buyError) {
      toast.error(localize('Purchase Failed'), { description: buyError });
      onClearBuyResult();
    }
  }, [buyError, onClearBuyResult, localize]);

  useEffect(() => {
    if (buyResult) {
      toast.success(localize('Contract Purchased'), {
        description: localize(
          'Buy price: {{buy_price}} USD | Payout: {{payout}} USD | Balance: {{balance}} USD',
          {
            buy_price: buyResult.buyPrice.toFixed(2),
            payout: buyResult.payout.toFixed(2),
            balance: buyResult.balanceAfter.toFixed(2),
          }
        ),
      });
      onClearBuyResult();
    }
  }, [buyResult, onClearBuyResult, localize]);

  const contractOptions = [
    { key: 'OVER', label: 'Over' },
    { key: 'UNDER', label: 'Under' },
    { key: 'EVEN', label: 'Even' },
    { key: 'ODD', label: 'Odd' },
    { key: 'MATCH', label: 'Matches' },
    { key: 'DIFFER', label: 'Differs' },
  ] as const;

  const [selectedContract, setSelectedContract] = useState<'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCH' | 'DIFFER'>('OVER');
  const [selectedDigit, setSelectedDigit] = useState<number>(0);

  const contractDisabledForDigits = selectedContract === 'EVEN' || selectedContract === 'ODD';
  const digitOptions = Array.from({ length: 10 }, (_, value) => value);
  const payoutMultiplier = useMemo(() => {
    const overPayouts: Record<number, number> = {
      0: 22,
      1: 33,
      2: 43,
      3: 54,
      4: 65,
      5: 76,
      6: 93,
      7: 148,
      8: 297,
    };
    const underPayouts: Record<number, number> = {
      9: 22,
      8: 33,
      7: 43,
      6: 54,
      5: 65,
      4: 76,
      3: 93,
      2: 148,
      1: 297,
    };

    switch (selectedContract) {
      case 'EVEN':
      case 'ODD':
        return 1 + 87 / 100;
      case 'MATCH':
      case 'DIFFER':
        return 1 + 347.765 / 100;
      case 'OVER':
        return 1 + (overPayouts[selectedDigit] ?? 0) / 100;
      case 'UNDER':
        return 1 + (underPayouts[selectedDigit] ?? 0) / 100;
      default:
        return 1;
    }
  }, [selectedContract, selectedDigit]);

  const payoutPreview = useMemo(() => {
    const numericStake = Number(stake) || 0;
    return numericStake > 0 ? numericStake * payoutMultiplier : 0;
  }, [payoutMultiplier, stake]);

  const getLastDigit = (value: number): number => {
    if (!Number.isFinite(value)) return 0;
    const text = String(value);
    const lastChar = text.includes('.') ? (text.split('.')[1] ?? '0').trim().slice(-1) || '0' : text.slice(-1) || '0';
    return Number.parseInt(lastChar, 10) || 0;
  };

  const handleDigitBuy = async () => {
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake <= 0) {
      toast.error('Enter a valid stake before placing the trade.');
      return;
    }

    const outcomeDigit = Math.floor(Math.random() * 10);
    const win =
      selectedContract === 'EVEN' ? outcomeDigit % 2 === 0 :
      selectedContract === 'ODD' ? outcomeDigit % 2 !== 0 :
      selectedContract === 'MATCH' ? outcomeDigit === selectedDigit :
      selectedContract === 'DIFFER' ? outcomeDigit !== selectedDigit :
      selectedContract === 'OVER' ? outcomeDigit > selectedDigit :
      outcomeDigit < selectedDigit;

    const payout = win ? numericStake * payoutMultiplier : 0;
    const profit = win ? payout - numericStake : -numericStake;

    const payload = {
      market_symbol: activeSymbol?.underlying_symbol ?? 'UNKNOWN',
      market_name: activeSymbol?.underlying_symbol_name ?? activeSymbol?.underlying_symbol ?? 'Digit market',
      contract_type: selectedContract,
      prediction_digit: ['EVEN', 'ODD'].includes(selectedContract) ? null : selectedDigit,
      outcome_digit: outcomeDigit,
      stake: Number(numericStake.toFixed(2)),
      payout: Number(payout.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      win,
      duration_ticks: Number(duration) || 1,
    };

    try {
      const result = await recordDigitTrade(payload);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selectedContract} trade ${win ? 'won' : 'lost'} — payout $${payout.toFixed(2)}.`);
      }
    } catch {
      toast.error('Could not record the digit-market trade.');
    }

    if (typeof window !== 'undefined') {
      const history = JSON.parse(window.localStorage.getItem('digit-market-history') ?? '[]');
      const entry = { ...payload, created_at: new Date().toISOString() };
      window.localStorage.setItem('digit-market-history', JSON.stringify([entry, ...history].slice(0, 20)));
    }
  };

  return (
    <div className="w-full space-y-3 lg:space-y-4">
      <div className="rounded-2xl border border-border bg-muted/25 p-2.5">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <Localize i18n_default_text="Contract type" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {contractOptions.map((option) => {
            const isSelected = selectedContract === option.key;
            return (
              <Button
                key={option.key}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto min-h-[44px] rounded-xl px-2 py-2 text-sm font-medium"
                onClick={() => setSelectedContract(option.key)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <Localize i18n_default_text="Digit prediction" />
        </div>

        {contractDisabledForDigits ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Select even or odd to evaluate the last digit parity.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {digitOptions.map((digit) => (
              <Button
                key={digit}
                type="button"
                variant={selectedDigit === digit ? 'default' : 'outline'}
                className="h-10 rounded-xl text-sm font-medium"
                onClick={() => setSelectedDigit(digit)}
              >
                {digit}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stake" className="text-xs text-muted-foreground">
          <Localize i18n_default_text="Stake" />
        </Label>
        <Input
          id="stake"
          type="number"
          value={stake}
          onChange={(e) => onStakeChange(e.target.value)}
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
          }}
          min={0}
          step="0.01"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="duration-ticks" className="text-xs text-muted-foreground">
          <Localize i18n_default_text="Duration (ticks)" />
        </Label>
        <Input
          id="duration-ticks"
          type="number"
          inputMode="numeric"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
          }}
          min={1}
          step={1}
          placeholder="1"
          className="rounded-xl"
        />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Prediction</span>
          <span className="font-medium text-foreground">{contractDisabledForDigits ? selectedContract : `${selectedContract} ${selectedDigit}`}</span>
        </div>
      </div>

      <div className="max-lg:fixed max-lg:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] max-lg:left-3 max-lg:right-3 lg:static">
        <Button
          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
          disabled={!isConnected || !proposal || isBuying}
          onClick={handleDigitBuy}
        >
          {isBuying ? (
            <Localize i18n_default_text="Purchasing..." />
          ) : (
            <span className="flex flex-col items-center leading-tight gap-0.5">
              <span><Localize i18n_default_text="Buy" /></span>
              <span className="text-xs font-normal opacity-90">
                <Localize
                  i18n_default_text="Payout {{payout}} USD"
                  values={{ payout: payoutPreview.toFixed(2) }}
                />
              </span>
            </span>
          )}
        </Button>
      </div>

      {isAuthenticated && (
        <Button
          asChild
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          <Link href="/reports">
            <Localize i18n_default_text="View your positions →" />
          </Link>
        </Button>
      )}
    </div>
  );
}
