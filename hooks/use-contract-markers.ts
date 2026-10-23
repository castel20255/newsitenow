'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OpenPosition } from '@/hooks/use-open-positions';
import {
  calculateContractMarkers,
  calculateRecordedTradeMarkers,
  type ContractMarker,
  type RecordedTradeMarkerInput,
} from '@/lib/chart-markers';

/**
 * Hook that computes chart contract markers from open positions.
 * These markers are passed to SmartCharts via the `contracts_array` prop
 * to render entry spots, start-time lines, and direction arrows on the chart
 * when trades are placed.
 *
 * @param positions    - Array of currently open positions from useOpenPositions hook
 * @param activeSymbol - The underlying symbol string of the currently active chart
 * @param isMobile     - Controls contractMarkerLeftPadding (10 on mobile, 100 on desktop)
 * @returns Array of ContractMarker objects for SmartCharts
 */
export function useContractMarkers(
  positions: OpenPosition[],
  activeSymbol: string | undefined,
  isMobile = false,
  trades: RecordedTradeMarkerInput[] = []
): ContractMarker[] {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const nextExpiry = trades.reduce<number | null>((earliest, trade) => {
      if (trade.status === 'open') return earliest;
      const settledAt = Date.parse(trade.settled_at ?? trade.created_at);
      const expiresAt = settledAt + 60_000;
      if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) return earliest;
      return earliest === null ? expiresAt : Math.min(earliest, expiresAt);
    }, null);
    if (nextExpiry === null) return;

    const timer = window.setTimeout(() => setNowMs(Date.now()), Math.max(0, nextExpiry - nowMs));
    return () => window.clearTimeout(timer);
  }, [trades, nowMs]);

  return useMemo(
    () => [
      ...calculateContractMarkers(positions, activeSymbol, isMobile),
      ...calculateRecordedTradeMarkers(trades, activeSymbol, isMobile, nowMs),
    ],
    [positions, activeSymbol, isMobile, trades, nowMs]
  );
}
