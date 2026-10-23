'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Localize } from '@deriv-com/translations';
import { recordDigitTrade } from '@/app/actions/digit-trading';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { MIN_TRADE_STAKE } from '@/lib/trading-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DigitContractActions, RiseFallActions } from '@/components/digit-contract-actions';
import { DigitPredictionButton } from '@/components/digit-prediction-button';
import { DigitSpread, type DigitExitHighlight } from '@/components/digit-spread';
import type { LastDigitStatistics } from '@/lib/last-digit-statistics';
import { EndTimePicker } from '@/components/custom/end-time-picker';
import type { DerivWS, ActiveSymbol, ProposalInfo, BuyResult } from '@deriv/core';
import type { DigitContractType, Direction, DurationSelectUnit, DurationOption } from '../lib/types';
import type { TradeMode } from '@/lib/market-symbol-filters';

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
  marketPrice: number | null;
  marketPrecision: number;
  proposal: ProposalInfo | null;

  onBuy: () => void;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;
  /** Whether the user is authenticated — shows the View your positions link when true. */
  isAuthenticated?: boolean;
  selectedContract: DigitContractType;
  onSelectedContractChange: (contract: DigitContractType) => void;
  tradeMode: TradeMode;
  showDigitSpread?: boolean;
  digitPercentages?: readonly number[];
  highestDigit?: number | null;
  lowestDigit?: number | null;
  onDigitStatsUpdate?: (statistics: LastDigitStatistics) => void;
  digitExitHighlight?: DigitExitHighlight | null;
  isForexBasket: boolean;
  onRiseFallBuy: (direction: Direction) => void;
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
  marketPrice,
  marketPrecision,
  proposal,
  onBuy,
  isBuying,
  buyResult,
  buyError,
  onClearBuyResult,
  isAuthenticated,
  selectedContract,
  onSelectedContractChange,
  tradeMode,
  showDigitSpread = false,
  digitPercentages,
  highestDigit = null,
  lowestDigit = null,
  onDigitStatsUpdate,
  digitExitHighlight,
  isForexBasket,
  onRiseFallBuy,
}: TradeControlsProps) {
  const { localize } = useAppTranslations();
  const { activeAccount, refresh: refreshSiteAuth } = useSiteAuth();

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

  const [selectedDigit, setSelectedDigit] = useState<number>(0);
  const [isSubmittingDigitTrade, setIsSubmittingDigitTrade] = useState(false);
  const digitTradeLock = useRef(false);

  const contractDisabledForDigits = selectedContract === 'EVEN' || selectedContract === 'ODD';
  const digitOptions = Array.from({ length: 10 }, (_, value) => value);
  const payoutMultiplier = useMemo(() => {
    const overPayouts: Record<number, number> = {
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
    const underPayouts: Record<number, number> = {
      9: 15,
      8: 26,
      7: 36,
      6: 47,
      5: 58,
      4: 69,
      3: 86,
      2: 141,
      1: 290,
    };

    switch (selectedContract) {
      case 'EVEN':
      case 'ODD':
        return 1 + 87 / 100;
      case 'MATCH':
        return 1 + 347.765 / 100;
      case 'DIFFER':
        return 1 + 19 / 100;
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

  const handleDigitBuy = async (contractType: DigitContractType = selectedContract) => {
    if (digitTradeLock.current) return;
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake < MIN_TRADE_STAKE) {
      toast.error(`Minimum stake is $${MIN_TRADE_STAKE.toFixed(2)}.`);
      return;
    }
    if (!ws || !isConnected || !activeSymbol) {
      toast.error('Connect to a market before placing a digit trade.');
      return;
    }
    if (marketPrice === null || !Number.isFinite(marketPrice) || marketPrice <= 0) {
      toast.error('Waiting for the selected market price.');
      return;
    }

    const payload = {
      market_symbol: activeSymbol.underlying_symbol,
      market_name: activeSymbol.underlying_symbol_name ?? activeSymbol.underlying_symbol,
      contract_type: contractType,
      prediction_digit: ['EVEN', 'ODD'].includes(contractType) ? null : selectedDigit,
      entry_price: Number(marketPrice.toFixed(marketPrecision)),
      price_precision: marketPrecision,
      stake: Number(numericStake.toFixed(2)),
      duration_ticks: Number(duration) || 1,
      fundingSource: activeAccount?.account_type === 'app_wallet' ? 'app_wallet' as const : 'demo' as const,
    };

    digitTradeLock.current = true;
    setIsSubmittingDigitTrade(true);
    try {
      const result = await recordDigitTrade(payload);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.skipped || !result?.success) {
        toast.error('Sign in to save digit trades to your selected account.');
        return;
      }
      digitTradeLock.current = false;
      setIsSubmittingDigitTrade(false);
      toast.success('Trade placed');
      void refreshSiteAuth();
    } catch {
      toast.error('Could not record the digit-market trade.');
      return;
    } finally {
      digitTradeLock.current = false;
      setIsSubmittingDigitTrade(false);
    }
  };

  if (tradeMode === 'market-only') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Choose a contract tab to trade the continuous volatility indices.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 lg:space-y-4">
      <div className="hidden rounded-2xl border border-border bg-muted/25 p-2.5">
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
                onClick={() => onSelectedContractChange(option.key)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {tradeMode === 'digits' && <div className="space-y-2">
        {showDigitSpread && (
          <DigitSpread
            symbol={activeSymbol?.underlying_symbol}
            currentPrice={marketPrice}
            currentPrecision={marketPrecision}
            onStatsUpdate={onDigitStatsUpdate}
            exitHighlight={digitExitHighlight}
          />
        )}
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
              <DigitPredictionButton
                key={digit}
                digit={digit}
                percentage={digitPercentages?.[digit] ?? 0}
                selected={selectedDigit === digit}
                highest={highestDigit === digit}
                lowest={lowestDigit === digit}
                onSelect={() => setSelectedDigit(digit)}
              />
            ))}
          </div>
        )}
      </div>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
            min={MIN_TRADE_STAKE}
            step="0.01"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duration-ticks" className="text-xs text-muted-foreground">
            {tradeMode === 'rise-fall' || tradeMode === 'forex-rise-fall' ? 'Duration (seconds)' : <Localize i18n_default_text="Duration (ticks)" />}
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
            min={tradeMode === 'rise-fall' || tradeMode === 'forex-rise-fall' ? 15 : 1}
            max={tradeMode === 'rise-fall' || tradeMode === 'forex-rise-fall' ? 300 : undefined}
            step={1}
            placeholder="1"
            className="rounded-xl"
          />
        </div>
      </div>

      {tradeMode === 'digits' && <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Prediction</span>
          <span className="font-medium text-foreground">{contractDisabledForDigits ? selectedContract : `${selectedContract} ${selectedDigit}`}</span>
        </div>
      </div>}

      {tradeMode === 'digits' && (
        <DigitContractActions
          selectedContract={selectedContract}
          disabled={!Number.isFinite(Number(stake)) || Number(stake) < MIN_TRADE_STAKE || isBuying || isSubmittingDigitTrade}
          onBuy={contractType => void handleDigitBuy(contractType)}
        />
      )}
      {(tradeMode === 'rise-fall' || tradeMode === 'forex-rise-fall') && (
        <RiseFallActions
          disabled={!Number.isFinite(Number(stake)) || Number(stake) < MIN_TRADE_STAKE || isBuying}
          onBuy={onRiseFallBuy}
          labels={isForexBasket ? { rise: 'Buy', fall: 'Sell' } : undefined}
        />
      )}

      {isAuthenticated && (
        <Button
          asChild
          variant="ghost"
          className="hidden w-full text-sm text-muted-foreground hover:text-foreground sm:flex"
        >
          <Link href="/reports">
            <Localize i18n_default_text="View your positions →" />
          </Link>
        </Button>
      )}
    </div>
  );
}
