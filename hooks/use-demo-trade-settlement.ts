'use client';

import { useEffect, useRef } from 'react';
import { settleDemoTrade } from '@/app/actions/demo-trading';
import { settleDigitTrade } from '@/app/actions/digit-trading';
import type { SiteAuthState, SitePaperTrade } from '@/components/custom/site-auth-provider';
import { resolveTradeExpiryMs } from '@/lib/duration-utils';

const CHECK_INTERVAL_MS = 250;
const RETRY_DELAY_MS = 5000;

export function useDemoTradeSettlement({
  authState,
  paperTrades,
  digitTrades,
  refresh,
}: {
  authState: SiteAuthState;
  paperTrades: SitePaperTrade[];
  digitTrades: SitePaperTrade[];
  refresh: () => Promise<void>;
}) {
  const inFlight = useRef(new Set<string>());
  const retryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (authState !== 'authenticated') return;

    let active = true;
    const openTrades = paperTrades.filter(trade => trade.status === 'open');
    const openDigitTrades = digitTrades.filter(trade => trade.status === 'open');

    const settleIfDue = async (trade: SitePaperTrade) => {
      if (!active || inFlight.current.has(trade.id)) return;

      const expiresAtMs = resolveTradeExpiryMs(trade);
      if (expiresAtMs === null) return;

      const remaining = expiresAtMs - Date.now();
      if (remaining > 0) return;

      inFlight.current.add(trade.id);
      try {
        const result = await settleDemoTrade(trade.id);
        if (result.error) {
          if (!/has not expired/i.test(result.error)) {
            throw new Error(result.error);
          }
          return;
        }
        await refresh();
      } catch {
        if (!active) return;
        const timer = retryTimers.current.get(trade.id);
        if (timer) clearTimeout(timer);
        retryTimers.current.set(trade.id, setTimeout(() => {
          retryTimers.current.delete(trade.id);
          void settleIfDue(trade);
        }, RETRY_DELAY_MS));
      } finally {
        inFlight.current.delete(trade.id);
      }
    };

    const settleDigitIfDue = async (trade: SitePaperTrade) => {
      if (!active || inFlight.current.has(trade.id)) return;
      const expiresAtMs = Date.parse(trade.expires_at);
      if (!Number.isFinite(expiresAtMs) || expiresAtMs > Date.now()) return;

      inFlight.current.add(trade.id);
      try {
        const result = await settleDigitTrade(trade.id);
        if ('pending' in result && result.pending) return;
        if ('error' in result) throw new Error(result.error);
        await refresh();
      } catch {
        if (!active) return;
        const timer = retryTimers.current.get(trade.id);
        if (timer) clearTimeout(timer);
        retryTimers.current.set(trade.id, setTimeout(() => {
          retryTimers.current.delete(trade.id);
          void settleDigitIfDue(trade);
        }, RETRY_DELAY_MS));
      } finally {
        inFlight.current.delete(trade.id);
      }
    };

    const tick = () => {
      if (!active) return;
      for (const trade of openTrades) {
        void settleIfDue(trade);
      }
      for (const trade of openDigitTrades) {
        void settleDigitIfDue(trade);
      }
    };

    tick();
    const interval = setInterval(tick, CHECK_INTERVAL_MS);

    return () => {
      active = false;
      for (const timer of retryTimers.current.values()) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [authState, paperTrades, digitTrades, refresh]);
}