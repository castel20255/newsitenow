'use client';

import { useEffect, useRef } from 'react';
import { settleDigitTrade } from '@/app/actions/digit-trading';
import type { SiteAuthState, SitePaperTrade } from '@/components/custom/site-auth-provider';

const EXPIRY_RETRY_MS = 250;
const FAILURE_RETRY_MS = 1500;

export function useDigitTradeSettlement({
  authState,
  digitTrades,
  refresh,
}: {
  authState: SiteAuthState;
  digitTrades: SitePaperTrade[];
  refresh: () => Promise<void>;
}) {
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (authState !== 'authenticated') return;

    let active = true;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const schedule = (trade: SitePaperTrade, delay: number) => {
      if (!active || timers.has(trade.id)) return;
      const timer = setTimeout(() => {
        timers.delete(trade.id);
        void settleWhenDue(trade);
      }, Math.max(0, delay));
      timers.set(trade.id, timer);
    };

    const settleWhenDue = async (trade: SitePaperTrade) => {
      if (!active || inFlight.current.has(trade.id)) return;

      const expiry = Date.parse(trade.expires_at);
      if (!Number.isFinite(expiry)) return;

      const remaining = expiry - Date.now();
      if (remaining > 0) {
        schedule(trade, remaining);
        return;
      }

      inFlight.current.add(trade.id);
      try {
        const result = await settleDigitTrade(trade.id);
        if (result.error) {
          schedule(trade, /has not expired/i.test(result.error) ? EXPIRY_RETRY_MS : FAILURE_RETRY_MS);
          return;
        }
        await refresh();
      } catch {
        schedule(trade, FAILURE_RETRY_MS);
      } finally {
        inFlight.current.delete(trade.id);
      }
    };

    for (const trade of digitTrades) {
      if (trade.status === 'open') void settleWhenDue(trade);
    }

    return () => {
      active = false;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, [authState, digitTrades, refresh]);
}