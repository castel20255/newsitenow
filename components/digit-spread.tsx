'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getPublicWsUrl } from '@deriv/core';
import {
  DEFAULT_DIGIT_WINDOW_SIZE,
  extractLastDigit,
  LastDigitStatisticsCalculator,
  type LastDigitStatistics,
} from '@/lib/last-digit-statistics';

interface DigitSpreadProps {
  symbol?: string | null;
  currentPrice?: number | null;
  currentPrecision?: number;
  windowSize?: number;
  onStatsUpdate?: (statistics: LastDigitStatistics) => void;
  floating?: boolean;
}

type FeedStatus = 'connecting' | 'live' | 'reconnecting' | 'unavailable';

function requestPublicDeriv<T>(payload: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(getPublicWsUrl());
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {}
      callback();
    };
    const timer = window.setTimeout(() => {
      finish(() => reject(new Error('Digit spread request timed out.')));
    }, 8000);

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ ...payload, req_id: 1 }));
    });

    socket.addEventListener('message', (event) => {
      try {
        const response = JSON.parse(String(event.data)) as T & { req_id?: number; error?: { message?: string } };
        if (response.req_id !== 1) return;
        if ('error' in response && response.error) {
          finish(() => reject(new Error(response.error?.message ?? 'Market data request failed.')));
          return;
        }
        finish(() => resolve(response as T));
      } catch {
        finish(() => reject(new Error('The market returned an invalid response.')));
      }
    });

    socket.addEventListener('error', () => {
      finish(() => reject(new Error('Could not connect to the public market feed.')));
    });

    socket.addEventListener('close', () => {
      if (!settled) {
        finish(() => reject(new Error('The public market connection closed.')));
      }
    });
  });
}

export function DigitSpread({
  symbol,
  currentPrice,
  currentPrecision,
  windowSize = DEFAULT_DIGIT_WINDOW_SIZE,
  onStatsUpdate,
  floating = false,
}: DigitSpreadProps) {
  const resolvedWindowSize = Number.isSafeInteger(windowSize) && windowSize > 0
    ? windowSize
    : DEFAULT_DIGIT_WINDOW_SIZE;
  const [statistics, setStatistics] = useState<LastDigitStatistics>(
    () => new LastDigitStatisticsCalculator(resolvedWindowSize).getStatistics()
  );
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('connecting');
  const onStatsUpdateRef = useRef(onStatsUpdate);
  onStatsUpdateRef.current = onStatsUpdate;

  useEffect(() => {
    if (!symbol) {
      const emptyStatistics = new LastDigitStatisticsCalculator(resolvedWindowSize).getStatistics();
      setStatistics(emptyStatistics);
      setFeedStatus('unavailable');
      return;
    }

    let active = true;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let reconnectAttempt = 0;
    let malformedMessages = 0;
    let historyPrecision: number | undefined;
    const calculator = new LastDigitStatisticsCalculator(resolvedWindowSize);
    const publish = (nextStatistics: LastDigitStatistics) => {
      setStatistics(nextStatistics);
      try {
        onStatsUpdateRef.current?.(nextStatistics);
      } catch {
        // A consumer callback must not interrupt the live feed.
      }
    };

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== undefined) return;
      setFeedStatus('reconnecting');
      const delay = Math.min(1000 * (2 ** reconnectAttempt), 15000);
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, delay);
    };

    const connect = () => {
      if (!active) return;
      setFeedStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

      try {
        socket = new WebSocket(getPublicWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }

      socket.addEventListener('open', () => {
        if (!active || !socket || socket.readyState !== WebSocket.OPEN) return;
        try {
          socket.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        } catch {
          socket.close();
        }
      });

      socket.addEventListener('message', (event) => {
        if (!active) return;
      try {
          const response = JSON.parse(String(event.data)) as {
            error?: { message?: string };
            tick?: { symbol?: string; quote?: number | string; pip_size?: number };
          };
          if (response.error) {
            socket?.close();
            return;
          }

          const tick = response.tick;
          if (!tick || (tick.symbol && tick.symbol !== symbol)) return;
          if (typeof tick.quote !== 'number' && typeof tick.quote !== 'string') {
            malformedMessages += 1;
            if (malformedMessages >= 3) socket?.close();
            return;
          }

          const nextStatistics = calculator.pushTick(tick.quote, tick.pip_size ?? historyPrecision);
          if (!nextStatistics) {
            malformedMessages += 1;
            if (malformedMessages >= 3) socket?.close();
            return;
          }

          malformedMessages = 0;
          reconnectAttempt = 0;
          setFeedStatus('live');
          publish(nextStatistics);
        } catch {
          malformedMessages += 1;
          if (malformedMessages >= 3) socket?.close();
        }
      });

      socket.addEventListener('error', () => socket?.close());
      socket.addEventListener('close', () => {
        if (active) scheduleReconnect();
      });
    };

    const initializeFeed = async () => {
      setFeedStatus('connecting');
      try {
        const response = await requestPublicDeriv<{
          history?: { prices?: number[] };
          pip_size?: number;
        }>({
          ticks_history: symbol,
          style: 'ticks',
          count: resolvedWindowSize,
          end: 'latest',
        });
        if (!active) return;
        historyPrecision = response.pip_size;
        publish(calculator.loadHistory(response.history?.prices ?? [], historyPrecision));
      } catch {
        if (!active) return;
        setFeedStatus('reconnecting');
      }
      connect();
    };

    void initializeFeed();
    return () => {
      active = false;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      try {
        socket?.close();
      } catch {}
    };
  }, [symbol, resolvedWindowSize]);

  const activeDigit = useMemo(() => {
    if (typeof currentPrice !== 'number') return 0;
    return extractLastDigit(currentPrice, currentPrecision) ?? 0;
  }, [currentPrice, currentPrecision]);

  const feedStatusLabel = {
    connecting: 'Connecting…',
    live: `${statistics.total_ticks} / ${resolvedWindowSize} ticks`,
    reconnecting: 'Reconnecting…',
    unavailable: 'Market unavailable',
  }[feedStatus];

  return (
    <div className={floating ? 'w-full' : 'rounded-2xl border border-border bg-muted/30 p-3'}>
      <div className={`mb-1 flex items-center justify-between gap-2 ${floating ? 'px-1' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`font-medium uppercase tracking-[0.22em] text-muted-foreground ${floating ? 'text-[9px]' : 'text-[11px]'}`}>0–9 spread</span>
        </div>
        <span className={`text-muted-foreground ${floating ? 'text-[9px]' : 'text-[10px]'}`}>{feedStatusLabel}</span>
      </div>

      <div className={`grid grid-cols-10 ${floating ? 'gap-0.5' : 'gap-1'}`}>
        {Array.from({ length: 10 }, (_, digit) => {
          const isSelected = digit === activeDigit;
          const entry = statistics.digits[String(digit) as keyof LastDigitStatistics['digits']];
          return (
            <div key={digit} className="flex min-w-0 flex-col items-center">
              <div
                className={`flex aspect-square w-full ${floating ? 'max-w-7' : 'max-w-9'} items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                  isSelected
                    ? 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                {digit}
              </div>
              <div className="flex h-1.5 items-start justify-center">
                {isSelected && <span className="border-x-[4px] border-t-0 border-b-[6px] border-x-transparent border-b-red-500" />}
              </div>
              <span className={`font-medium tabular-nums text-muted-foreground ${floating ? 'text-[8px]' : 'text-[9px]'}`}>
                {entry.percentage.toFixed(1)}%
              </span>
              {!floating && <span className="text-[8px] tabular-nums text-muted-foreground/75">{entry.count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
