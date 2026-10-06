'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  DerivWS,
  ActiveSymbol,
  Tick,
  ProposalInfo,
  BuyResult,
} from '@deriv/core';
import { useBaseTrading } from '@/hooks/use-base-trading';
import type { UseBaseTradingParams } from '@/hooks/use-base-trading';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import type { Direction, DurationSelectUnit, DurationOption, OpenPosition, ClosedPosition } from '../lib/types';

const CONTRACT_TYPES = ['CALL', 'PUT'];

interface UseRiseFallTradingReturn {
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  currentTick: Tick | null;
  prices: number[];
  pipSize: number;
  direction: Direction;
  setDirection: (direction: Direction) => void;
  allowEquals: boolean;
  setAllowEquals: (value: boolean) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;
  openPositions: OpenPosition[];
  closedPositions: ClosedPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;
  sellError: string | null;
  clearSellError: () => void;
}

export type UseRiseFallTradingParams = Pick<UseBaseTradingParams, 'ws' | 'isConnected' | 'isExhausted' | 'isAuthenticated' | 'onAuthWSFailed'>;

function clampDuration(value: number, option: DurationOption): number {
  if (!Number.isFinite(value) || value <= 0) return option.min;
  return Math.min(Math.max(value, option.min), option.max);
}

export function useRiseFallTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed }: UseRiseFallTradingParams): UseRiseFallTradingReturn {
  const { localize } = useAppTranslations();
  const {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
    prices,
    pipSize,
    contracts,
    openPositions,
    closedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  } = useBaseTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed, contractTypes: CONTRACT_TYPES });

  const [direction, setDirection] = useState<Direction>('CALL');
  const [allowEquals, setAllowEquals] = useState<boolean>(false);
  const [stake, setStake] = useState<string>('10');
  const [duration, setDurationRaw] = useState<string>('');
  const [durationUnit, setDurationUnitRaw] = useState<DurationSelectUnit>('s');
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<string>('');
  const [durationOptionsSymbol, setDurationOptionsSymbol] = useState<string | null>(null);

  const durationOptions = useMemo<DurationOption[]>(
    () => [{ unit: 's', label: 'Ticks', min: 1, max: 300 }],
    []
  );

  // Track durationUnit and activeSymbol in refs so the duration-options effect doesn't list them in deps
  const durationUnitRef = useRef(durationUnit);
  const activeSymbolKeyRef = useRef(activeSymbol?.underlying_symbol);

  useEffect(() => {
    durationUnitRef.current = durationUnit;
  }, [durationUnit]);

  useEffect(() => {
    activeSymbolKeyRef.current = activeSymbol?.underlying_symbol;
  }, [activeSymbol?.underlying_symbol]);

  /* eslint-disable react-hooks/set-state-in-effect -- reset duration/end-time state when contracts-derived options change */
  useEffect(() => {
    if (!durationOptions.length) return;
    setEndDate(undefined);
    setEndTime('');
    setDurationOptionsSymbol(activeSymbolKeyRef.current ?? null);
    const currentOpt = durationOptions.find(o => o.unit === durationUnitRef.current);
    if (!currentOpt) {
      const first = durationOptions[0];
      setDurationUnitRaw(first.unit);
      if (first.unit !== 'end-time') setDurationRaw(String(first.min));
    } else if (currentOpt.unit !== 'end-time') {
      setDurationRaw(prev => String(clampDuration(Number(prev), currentOpt)));
    }
  }, [durationOptions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setDuration = useCallback((value: string) => {
    if (durationUnit === 'end-time') return;
    if (value === '' || /^\d+$/.test(value)) setDurationRaw(value);
  }, [durationUnit]);

  const setDurationUnit = useCallback((unit: DurationSelectUnit) => {
    setDurationUnitRaw(unit);
    const opt = durationOptions.find(o => o.unit === unit);
    if (opt && unit !== 'end-time') setDurationRaw(String(opt.min));
  }, [durationOptions]);

  const { isBuying, buyResult, buyError, clearBuyResult } = {
    isBuying: false,
    buyResult: null,
    buyError: null,
    clearBuyResult: () => undefined,
  };

  const proposal: ProposalInfo | null = null;

  const buyContract = useCallback(async () => {
    throw new Error('Legacy rise/fall contract execution is disabled. This market now uses digit contract pricing only.');
  }, []);

  return {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
    prices,
    pipSize,
    direction,
    setDirection,
    allowEquals,
    setAllowEquals,
    stake,
    setStake,
    duration,
    setDuration,
    durationOptions,
    durationUnit,
    setDurationUnit,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
    proposal,
    buyContract,
    isBuying,
    buyResult,
    buyError,
    clearBuyResult,
    openPositions,
    closedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  };
}
