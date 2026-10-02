'use client';

import { useEffect, useRef } from 'react';
import { settleDemoTrade } from '@/app/actions/demo-trading';
import type { SiteAuthState, SitePaperTrade } from '@/components/custom/site-auth-provider';

const MAX_TIMEOUT_MS = 2_147_000_000;
const RETRY_DELAY_MS = 5000;

export function useDemoTradeSettlement({
  authState,
  paperTrades,
  refresh,
}: {
  authState: SiteAuthState;
  paperTrades: SitePaperTrade[];
  refresh: () => Promise<void>;
}) {
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (authState !== 'authenticated') return;

    let active = true;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const openTrades = paperTrades.filter(trade => trade.status === 'open');

    const schedule = (trade: SitePaperTrade, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        void settleIfDue(trade);
      }, Math.max(0, Math.min(delay, MAX_TIMEOUT_MS)));
      timers.add(timer);
    };

    const settleIfDue = async (trade: SitePaperTrade) => {
      if (!active || inFlight.current.has(trade.id)) return;
      const expiresAt = Date.parse(trade.expires_at);
      if (!Number.isFinite(expiresAt)) return;
      const remaining = expiresAt - Date.now();
      if (remaining > 0) {
        schedule(trade, remaining);
        return;
      }

      inFlight.current.add(trade.id);
      try {
        const result = await settleDemoTrade(trade.id);
        if (result.error) throw new Error(result.error);
        await refresh();
      } catch {
        if (active) schedule(trade, RETRY_DELAY_MS);
      } finally {
        inFlight.current.delete(trade.id);
      }
    };

    for (const trade of openTrades) {
      const remaining = Date.parse(trade.expires_at) - Date.now();
      schedule(trade, remaining > 0 ? remaining : 0);
    }

    return () => {
      active = false;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [authState, paperTrades, refresh]);
}