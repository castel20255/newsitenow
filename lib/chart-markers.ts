'use strict';

import type { OpenPosition } from '@/hooks/use-open-positions';

/**
 * Contract marker types supported by SmartCharts.
 */
export type ContractMarkerType =
  | 'TickContract'
  | 'NonTickContract'
  | 'AccumulatorContract';

export type MarkerDirection = 'up' | 'down';

/** Individual marker point passed in the `markers` array of a ContractMarker. */
export interface MarkerPoint {
  epoch: number;
  quote?: number | null;
  type: string;
  direction?: MarkerDirection;
  text?: string;
  textType?: string;
  displayOffsetY?: number;
  color?: string;
}

/**
 * A single contract marker entry for the SmartCharts `contracts_array` prop.
 */
export interface ContractMarker {
  type: ContractMarkerType;
  markers: MarkerPoint[];
  props: {
    isProfit: boolean;
    isRunning: boolean;
    contractMarkerLeftPadding: number;
    markerLabel: string | null;
  };
  direction: MarkerDirection;
  profitAndLossText: string | null;
  currentEpoch: number | null;
}

export interface RecordedTradeMarkerInput {
  symbol: string;
  market_symbol?: string;
  contract_type: string;
  stake: number | string;
  payout: number | string;
  entry_quote: number | string | null;
  exit_quote: number | string | null;
  entry_epoch?: number | null;
  created_at: string;
  settled_at: string | null;
  expires_at?: string;
  status: string;
}

const RECORDED_TRADE_MARKER_TTL_MS = 60_000;
const DIGIT_CONTRACTS = new Set(['OVER', 'UNDER', 'EVEN', 'ODD', 'MATCH', 'DIFFER']);

// Contract types supported in this project
const ACCUMULATOR_TYPES = new Set(['ACCU']);

// Rise/Fall UP contracts
const UP_CONTRACTS = new Set(['CALL', 'CALLE']);

// Rise/Fall DOWN contracts
const DOWN_CONTRACTS = new Set(['PUT', 'PUTE']);

/**
 * Determines the SmartCharts marker contract type.
 * Accumulators → 'AccumulatorContract'.
 * Rise/Fall with tick_count → 'TickContract'.
 * Rise/Fall without tick_count (time-based) → 'NonTickContract'.
 */
function getMarkerContractType(
  contractType: string,
  tickCount: number
): ContractMarkerType {
  if (ACCUMULATOR_TYPES.has(contractType)) {
    return 'AccumulatorContract';
  }
  return tickCount > 0 ? 'TickContract' : 'NonTickContract';
}

/**
 * Determines the marker direction for supported contract types.
 * CALL / CALLE → 'up', PUT / PUTE → 'down', ACCU → 'up' (neutral default).
 */
function getMarkerDirection(contractType: string): MarkerDirection {
  if (UP_CONTRACTS.has(contractType)) return 'up';
  if (DOWN_CONTRACTS.has(contractType)) return 'down';
  // Default to 'up' for ACCU and any unrecognised contract types
  return 'up';
}

/**
 * Formats profit/loss text for display on the chart marker.
 * Returns null if profit is not a valid number.
 */
function formatProfitLossText(profit: string, currency: string): string | null {
  const numericProfit = parseFloat(profit);
  if (isNaN(numericProfit)) return null;
  const sign = numericProfit > 0 ? '+' : '';
  return `${sign}${numericProfit.toFixed(2)} ${currency}`;
}

/**
 * Calculates a full contract marker from a live open position.
 *
 * Marker anatomy for an open NonTickContract / TickContract:
 *  - entrySpot      @ entry_tick_time with entry_spot quote
 *  - startTime      @ date_start (expanded line, only for the last contract)
 *  - contractMarker @ date_start (the pill/arrow — tick chart only, granularity=0)
 *  - exitTimeCollapsed @ date_expiry (time-based contracts only)
 *
 * Marker anatomy for AccumulatorContract:
 *  - entrySpot  @ entry_tick_time with entry_spot quote
 *  - startTime  @ date_start (only for the last active contract)
 *
 * @param position       - An open position from useOpenPositions
 * @param isLastContract - Whether this is the most-recently started contract
 *                         (receives the expanded startTime line)
 * @param isMobile       - Adjusts contractMarkerLeftPadding (10 vs 100)
 */
export function calculateMarkerFromPosition(
  position: OpenPosition,
  isLastContract = false,
  isMobile = false
): ContractMarker | null {
  if (!position.date_start) return null;

  const contractType = position.contract_type ?? '';
  const tickCount = position.tick_count ?? 0;
  const type = getMarkerContractType(contractType, tickCount);
  const direction = getMarkerDirection(contractType);
  const profitAndLossText = formatProfitLossText(position.profit, position.currency);

  const entrySpotTime = position.entry_tick_time ?? position.date_start;
  const entrySpotQuote = position.entry_spot ?? null;

  const profit = parseFloat(position.profit);
  const isProfit = isNaN(profit) ? true : profit >= 0;
  const isRunning = !position.is_sold && !position.is_expired;
  const resultColor = isRunning ? undefined : isProfit ? '#16a34a' : '#dc2626';

  const contractMarkerLeftPadding = isMobile ? 10 : 100;
  const isAccumulator = type === 'AccumulatorContract';
  const isTickContract = type === 'TickContract';

  const markers: MarkerPoint[] = [];

  // Entry spot marker — shown for all supported contract types
  if (entrySpotQuote !== null) {
    markers.push({
      epoch: entrySpotTime,
      quote: entrySpotQuote,
      type: 'entrySpot',
      direction,
      ...(resultColor ? { color: resultColor } : {}),
    });
  }

  const isContractClosed = !!position.is_sold || !!position.is_expired;
  const exitSpotTime = position.exit_spot_time ?? null;
  const exitSpotQuote = position.exit_spot ?? null;

  if (!isAccumulator) {
    if (isContractClosed) {
      // --- Closed NonTick/Tick contract markers ---

      // exitSpot — filled dot at the exit price
      if (exitSpotTime !== null && exitSpotQuote !== null) {
        markers.push({
          epoch: exitSpotTime,
          quote: exitSpotQuote,
          type: 'exitSpot',
          direction,
          color: resultColor,
        });

        // profitAndLossLabel — the P&L badge shown above/below the exit dot
        if (profitAndLossText !== null) {
          const exitAboveEntry =
            entrySpotQuote !== null ? exitSpotQuote >= entrySpotQuote : true;
          markers.push({
            epoch: exitSpotTime,
            quote: exitSpotQuote,
            type: 'profitAndLossLabel',
            direction,
            displayOffsetY: exitAboveEntry ? -24 : 24,
            color: resultColor,
          });
        }
      }
    } else {
      // --- Running NonTick/Tick contract markers ---

      // startTimeCollapsed — collapsed start marker shown for all running contracts
      // when entry_spot is known. Creates the hollow circle + horizontal dotted line
      // at entry spot price, connecting contractMarker to entrySpot.
      if (entrySpotQuote !== null) {
        markers.push({
          epoch: position.date_start,
          quote: entrySpotQuote,
          type: 'startTimeCollapsed',
          direction,
        });
      }

      // startTime — expanded vertical dashed line, only for the most recently
      // purchased contract.
      if (isLastContract) {
        markers.push({
          epoch: position.date_start,
          ...(entrySpotQuote !== null ? { quote: entrySpotQuote } : {}),
          type: 'startTime',
          direction,
        });
      }

      // contractMarker — the pill/direction-arrow rendered at date_start.
      if (entrySpotQuote !== null) {
        // For tick contracts show a running tick counter (e.g. "3/5")
        // tick_stream is an array that grows by one entry per elapsed tick
        const tickPassed = position.tick_stream?.length ?? 0;
        const tickCounterText = isTickContract ? `${tickPassed}/${tickCount}` : undefined;

        markers.push({
          epoch: position.date_start,
          quote: entrySpotQuote,
          type: 'contractMarker',
          direction,
          ...(tickCounterText ? { text: tickCounterText, textType: 'counter' } : {}),
        });
      }

      // exitTimeCollapsed — dashed vertical end-time line at contract end
      if (position.date_expiry) {
        markers.push({
          epoch: position.date_expiry,
          quote: entrySpotQuote ?? 0,
          type: 'exitTimeCollapsed',
          direction,
        });
      }
    }
  } else {
    // Accumulator
    if (isContractClosed) {
      // Closed accumulator: show exit spot and P&L label
      if (exitSpotTime !== null && exitSpotQuote !== null) {
        markers.push({
          epoch: exitSpotTime,
          quote: exitSpotQuote,
          type: 'exitSpot',
          direction,
          color: resultColor,
        });

        if (profitAndLossText !== null) {
          const exitAboveEntry =
            entrySpotQuote !== null ? exitSpotQuote >= entrySpotQuote : true;
          markers.push({
            epoch: exitSpotTime,
            quote: exitSpotQuote,
            type: 'profitAndLossLabel',
            direction,
            displayOffsetY: exitAboveEntry ? -24 : 24,
            color: resultColor,
          });
        }
      }
    } else {
      // Running accumulator: show startTime line for the active (last) contract
      if (isLastContract) {
        markers.push({
          epoch: position.date_start,
          quote: entrySpotQuote ?? 0,
          type: 'startTime',
          direction,
        });
      }
    }
  }

  const currentEpoch = position.current_spot_time ?? Math.floor(Date.now() / 1000);

  return {
    type,
    markers,
    props: {
      isProfit,
      isRunning,
      contractMarkerLeftPadding,
      markerLabel: null,
    },
    direction,
    profitAndLossText,
    currentEpoch,
  };
}

/**
 * Computes the contracts_array for SmartCharts from a list of open positions.
 *
 * - Filters to positions matching the active symbol.
 * - Sorts by date_start descending so the most-recently purchased contract is
 *   index 0 and receives the expanded startTime line.
 */
export function calculateContractMarkers(
  positions: OpenPosition[],
  activeSymbol: string | undefined,
  isMobile = false
): ContractMarker[] {
  if (!activeSymbol || positions.length === 0) return [];

  const filtered = positions.filter(
    (p) => p.underlying_symbol === activeSymbol
  );

  if (filtered.length === 0) return [];

  // Sort newest first so index 0 is the last-purchased contract
  const sorted = [...filtered].sort(
    (a, b) => (b.date_start ?? 0) - (a.date_start ?? 0)
  );

  const markers: ContractMarker[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const marker = calculateMarkerFromPosition(sorted[i], i === 0, isMobile);
    if (marker) markers.push(marker);
  }

  return markers;
}

export function calculateRecordedTradeMarkers(
  trades: RecordedTradeMarkerInput[],
  activeSymbol: string | undefined,
  isMobile = false,
  nowMs = Date.now()
): ContractMarker[] {
  if (!activeSymbol) return [];

  return trades.flatMap((trade) => {
    if ((trade.market_symbol ?? trade.symbol) !== activeSymbol) return [];

    const createdAtMs = Date.parse(trade.created_at);
    const settledAtMs = trade.settled_at ? Date.parse(trade.settled_at) : createdAtMs;
    const isRunning = trade.status === 'open';
    if (!isRunning && (!Number.isFinite(settledAtMs) || nowMs - settledAtMs >= RECORDED_TRADE_MARKER_TTL_MS)) {
      return [];
    }

    const entryQuote = trade.entry_quote === null ? null : Number(trade.entry_quote);
    if (entryQuote === null || !Number.isFinite(entryQuote)) return [];
    const entryEpoch = Number.isSafeInteger(trade.entry_epoch) && Number(trade.entry_epoch) > 0
      ? Number(trade.entry_epoch)
      : Math.floor(createdAtMs / 1000);
    if (!Number.isSafeInteger(entryEpoch) || entryEpoch <= 0) return [];

    const direction: MarkerDirection = ['CALL', 'CALLE', 'OVER', 'EVEN', 'MATCH'].includes(trade.contract_type)
      ? 'up'
      : 'down';
    const exitQuote = trade.exit_quote === null ? null : Number(trade.exit_quote);
    const exitEpoch = Number.isFinite(settledAtMs) ? Math.floor(settledAtMs / 1000) : null;
    const stake = Number(trade.stake);
    const payout = Number(trade.payout);
    const profit = payout - stake;
    const isProfit = !isRunning && Number.isFinite(profit) && profit >= 0;
    const resultColor = isRunning ? undefined : isProfit ? '#16a34a' : '#dc2626';
    const profitAndLossText = !isRunning && Number.isFinite(profit)
      ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)} USD`
      : null;
    const markers: MarkerPoint[] = [{
      epoch: entryEpoch,
      quote: entryQuote,
      type: 'entrySpot',
      direction,
      ...(resultColor ? { color: resultColor } : {}),
    }];

    if (!isRunning && exitEpoch !== null && exitQuote !== null && Number.isFinite(exitQuote)) {
      markers.push({ epoch: exitEpoch, quote: exitQuote, type: 'exitSpot', direction, color: resultColor });
      if (profitAndLossText !== null) {
        markers.push({
          epoch: exitEpoch,
          quote: exitQuote,
          type: 'profitAndLossLabel',
          direction,
          displayOffsetY: exitQuote >= entryQuote ? -24 : 24,
          color: resultColor,
        });
      }
    } else if (isRunning) {
      markers.push({ epoch: entryEpoch, quote: entryQuote, type: 'startTimeCollapsed', direction });
      if (!DIGIT_CONTRACTS.has(trade.contract_type) && trade.expires_at) {
        const expiryEpoch = Math.floor(Date.parse(trade.expires_at) / 1000);
        if (Number.isSafeInteger(expiryEpoch) && expiryEpoch > entryEpoch) {
          markers.push({ epoch: expiryEpoch, quote: entryQuote, type: 'exitTimeCollapsed', direction });
        }
      }
    }

    return [{
      type: DIGIT_CONTRACTS.has(trade.contract_type) ? 'TickContract' : 'NonTickContract',
      markers,
      props: {
        isProfit,
        isRunning,
        contractMarkerLeftPadding: isMobile ? 10 : 100,
        markerLabel: null,
      },
      direction,
      profitAndLossText,
      currentEpoch: isRunning ? Math.floor(nowMs / 1000) : exitEpoch,
    }];
  });
}
