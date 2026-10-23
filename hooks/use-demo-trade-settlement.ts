'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { settleDemoTrade } from '@/app/actions/demo-trading';
import { settleDigitTrade } from '@/app/actions/digit-trading';
import type { SiteAuthState, SitePaperTrade } from '@/components/custom/site-auth-provider';
import { resolveTradeExpiryMs } from '@/lib/duration-utils';

const CHECK_INTERVAL_MS = 250;
const RETRY_DELAY_MS = 5000;
const DIGIT_RETRY_DELAY_MS = 500;
const payoutMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function notifyTradeResult(
  trade: SitePaperTrade,
  status: string | undefined,
  payout: number,
  outcomeDigit?: number
): boolean {
  if (status !== 'won' && status !== 'lost') return false;

  const won = status === 'won';
  const contractName: Record<string, string> = {
    CALL: 'Rise',
    PUT: 'Fall',
    CALLE: 'Rise (Equal)',
    PUTE: 'Fall (Equal)',
    OVER: 'Over',
    UNDER: 'Under',
    EVEN: 'Even',
    ODD: 'Odd',
    MATCH: 'Matches',
    DIFFER: 'Differs',
  };
  const details = [
    contractName[trade.contract_type] ?? trade.contract_type,
    won
      ? `Amount paid out: ${payoutMoney.format(Number.isFinite(payout) ? payout : 0)}`
      : `Amount lost: ${payoutMoney.format(Number(trade.stake))}`,
    outcomeDigit === undefined ? null : `Exit digit: ${outcomeDigit}`,
  ].filter(Boolean).join(' · ');
  const toastOptions = {
    description: details,
    duration: 3000,
    className: won ? 'trade-result-toast trade-result-toast-win' : 'trade-result-toast trade-result-toast-loss',
    classNames: {
      title: won ? 'trade-result-title trade-result-win' : 'trade-result-title trade-result-loss',
      description: 'trade-result-description',
    },
    style: {
      backgroundColor: won ? 'rgb(34 166 242 / 0.14)' : 'rgb(220 38 38 / 0.12)',
      border: won ? '1px solid rgb(34 166 242 / 0.34)' : '1px solid rgb(220 38 38 / 0.3)',
      color: 'hsl(var(--foreground))',
    },
  };

  if (won) toast.success('WIN', toastOptions);
  else toast.error('LOSS', toastOptions);
  return true;
}

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
  const notifiedTrades = useRef(new Set<string>());
  const retryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const digitNextAttemptAt = useRef(new Map<string, number>());

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
        const settlement = result.result as { settled_status?: string; credited_payout?: number } | undefined;
        if (!notifiedTrades.current.has(trade.id) && notifyTradeResult(trade, settlement?.settled_status, Number(settlement?.credited_payout ?? 0))) {
          notifiedTrades.current.add(trade.id);
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
      if (!Number.isFinite(Date.parse(trade.expires_at))) return;
      if ((digitNextAttemptAt.current.get(trade.id) ?? 0) > Date.now()) return;

      inFlight.current.add(trade.id);
      try {
        const result = await settleDigitTrade(trade.id);
        if ('pending' in result && result.pending) {
          digitNextAttemptAt.current.set(
            trade.id,
            Date.now() + Math.max(250, Math.min(result.retryAfterMs ?? 500, 1000))
          );
          return;
        }
        if ('error' in result) throw new Error(result.error);
        digitNextAttemptAt.current.delete(trade.id);
        const settlementStatus = 'status' in result ? result.status : undefined;
        const settlementPayout = 'payout' in result ? Number(result.payout) : 0;
        const outcomeDigit = 'outcomeDigit' in result ? Number(result.outcomeDigit) : undefined;
        if (!notifiedTrades.current.has(trade.id) && notifyTradeResult(trade, settlementStatus, settlementPayout, outcomeDigit)) {
          notifiedTrades.current.add(trade.id);
        }
        await refresh();
      } catch {
        if (active) digitNextAttemptAt.current.set(trade.id, Date.now() + DIGIT_RETRY_DELAY_MS);
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