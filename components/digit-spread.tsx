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
    if (typeof currentPrice !== 'number') return null;
    return extractLastDigit(currentPrice, currentPrecision);
  }, [currentPrice, currentPrecision]);
  const extremeDigits = useMemo(() => {
    if (statistics.total_ticks === 0) return { highest: null, lowest: null };

    const percentages = Array.from({ length: 10 }, (_, digit) =>
      statistics.digits[String(digit) as keyof LastDigitStatistics['digits']].percentage
    );
    const highestPercentage = Math.max(...percentages);
    const lowestPercentage = Math.min(...percentages);
    if (highestPercentage === lowestPercentage) return { highest: null, lowest: null };

    return {
      highest: percentages.indexOf(highestPercentage),
      lowest: percentages.indexOf(lowestPercentage),
    };
  }, [statistics]);

  const feedStatusLabel = {
    connecting: 'Connecting…',
    live: `${statistics.total_ticks} / ${resolvedWindowSize} ticks`,
    reconnecting: 'Reconnecting…',
    unavailable: 'Market unavailable',
  }[feedStatus];

  return (
    <div className={floating ? 'w-full' : 'rounded-2xl border border-border bg-muted/30 p-3'}>
      <div className={`mb-1 flex items-center justify-between gap-2 ${floating ? 'px-1' : ''}`}>
        <span className={`text-muted-foreground ${floating ? 'text-[9px]' : 'text-[10px]'}`}>{feedStatusLabel}</span>
      </div>

      <div className={`grid grid-cols-10 ${floating ? 'gap-0.5' : 'gap-1'}`}>
        {Array.from({ length: 10 }, (_, digit) => {
          const isActive = digit === activeDigit;
          const isHighest = digit === extremeDigits.highest;
          const isLowest = digit === extremeDigits.lowest;
          const entry = statistics.digits[String(digit) as keyof LastDigitStatistics['digits']];
          return (
            <div
              key={digit}
              className="flex min-w-0 flex-col items-center"
              aria-label={`Digit ${digit}: ${entry.percentage.toFixed(1)} percent${isHighest ? ', highest frequency' : ''}${isLowest ? ', lowest frequency' : ''}`}
              title={`Digit ${digit}: ${entry.percentage.toFixed(1)}%${isHighest ? ' · Highest' : ''}${isLowest ? ' · Lowest' : ''}`}
            >
              <div className={`relative flex aspect-square w-full ${floating ? 'max-w-7' : 'max-w-9'} items-center justify-center`}>
                {(isHighest || isLowest) && (
                  <svg viewBox="0 0 40 40" className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] overflow-visible" aria-hidden="true">
                    <path
                      d="M 4 20 A 16 16 0 0 1 36 20"
                      fill="none"
                      stroke={isHighest ? '#16a34a' : '#9F0409'}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <div className="flex h-full w-full items-center justify-center rounded-full border border-border bg-background text-xs font-semibold tabular-nums text-foreground">
                  {digit}
                </div>
              </div>
              <div className="flex h-1.5 items-start justify-center">
                {isActive && <span role="img" aria-label="Current market digit" className="border-x-[4px] border-t-0 border-b-[6px] border-x-transparent border-b-red-500" />}
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
