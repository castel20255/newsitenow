'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPublicWsUrl } from '@deriv/core';

interface DigitSpreadProps {
  symbol?: string | null;
  currentPrice?: number | null;
}

interface DigitSpreadRecord {
  digit: number;
  count: number;
  percentage: number;
}

function getLastDigit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const normalized = Number(value.toFixed(10));
  const stringValue = String(normalized);
  if (!stringValue.includes('.')) {
    return Number.parseInt(stringValue.slice(-1), 10) || 0;
  }

  const decimals = stringValue.split('.')[1] ?? '0';
  const lastCharacter = decimals.trim().slice(-1) || '0';
  return Number.parseInt(lastCharacter, 10) || 0;
}

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

function getDigitSpreadData(prices: number[]): DigitSpreadRecord[] {
  const counts = Array.from({ length: 10 }, () => 0);
  prices.filter(Number.isFinite).forEach((price) => {
    const lastDigit = getLastDigit(price);
    counts[lastDigit] += 1;
  });

  const total = counts.reduce((sum, value) => sum + value, 0) || 1;
  const exactPercentages = counts.map((count) => (count / total) * 100);
  const percentages = exactPercentages.map(Math.floor);
  let remainingPercentage = 100 - percentages.reduce((sum, value) => sum + value, 0);
  const remainderOrder = exactPercentages
    .map((percentage, digit) => ({ digit, remainder: percentage - Math.floor(percentage) }))
    .sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; index < remainingPercentage; index += 1) {
    percentages[remainderOrder[index].digit] += 1;
  }

  return counts.map((count, digit) => ({
    digit,
    count,
    percentage: percentages[digit],
  }));
}

export function DigitSpread({ symbol, currentPrice }: DigitSpreadProps) {
  const [spread, setSpread] = useState<DigitSpreadRecord[]>(() =>
    Array.from({ length: 10 }, (_, digit) => ({ digit, count: 0, percentage: 0 }))
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setSpread(Array.from({ length: 10 }, (_, digit) => ({ digit, count: 0, percentage: 0 })));
      return;
    }

    let active = true;
    const fetchSpread = async () => {
      setIsLoading(true);
      try {
        const response = await requestPublicDeriv<{ history?: { prices?: number[] }; error?: { message?: string } }>({
          ticks_history: symbol,
          style: 'ticks',
          count: 500,
        });
        const prices = response.history?.prices ?? [];
        if (!active) return;
        setSpread(getDigitSpreadData(prices.slice(-500)));
      } catch {
        if (!active) return;
        setSpread(Array.from({ length: 10 }, (_, digit) => ({ digit, count: 0, percentage: 0 })));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchSpread();
    return () => {
      active = false;
    };
  }, [symbol]);

  const activeDigit = useMemo(() => (typeof currentPrice === 'number' && Number.isFinite(currentPrice) ? getLastDigit(currentPrice) : 0), [currentPrice]);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">0–9 spread</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{isLoading ? 'Updating…' : 'Last 500 ticks'}</span>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {spread.map((entry) => {
          const isSelected = entry.digit === activeDigit;
          return (
            <div key={entry.digit} className="flex min-w-0 flex-col items-center">
              <div
                className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                  isSelected
                    ? 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                {entry.digit}
              </div>
              <div className="flex h-2 items-start justify-center">
                {isSelected && <span className="border-x-[5px] border-t-0 border-b-[7px] border-x-transparent border-b-red-500" />}
              </div>
              <span className="text-[9px] font-medium tabular-nums text-muted-foreground">
                {entry.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
