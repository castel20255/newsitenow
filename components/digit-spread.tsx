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

  return counts.map((count, digit) => ({
    digit,
    count,
    percentage: (count / total) * 100,
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

  const meterRadius = 90;
  const activeDigit = useMemo(() => (typeof currentPrice === 'number' && Number.isFinite(currentPrice) ? getLastDigit(currentPrice) : 0), [currentPrice]);
  const pointerAngle = activeDigit * 36 - 90;

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">0–9 spread</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{isLoading ? 'Updating…' : 'Last 500 ticks'}</span>
      </div>

      <div className="relative mx-auto flex max-w-[300px] items-center justify-center">
        <svg viewBox="0 0 240 240" className="h-[220px] w-[220px] overflow-visible">
          <defs>
            <filter id="digit-spread-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.15)" />
            </filter>
          </defs>

          <circle cx="120" cy="120" r={meterRadius - 10} fill="rgba(148,163,184,0.04)" stroke="rgba(148,163,184,0.28)" strokeWidth="1.5" />

          {spread.map((entry, index) => {
            const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
            const labelRadius = meterRadius - 10;
            const x = 120 + Math.cos(angle) * labelRadius;
            const y = 120 + Math.sin(angle) * labelRadius;
            const arcRadius = meterRadius - 2;
            const startAngle = index / 10 * 2 * Math.PI - Math.PI / 2;
            const endAngle = ((index + 1) / 10) * 2 * Math.PI - Math.PI / 2;
            const startX = 120 + Math.cos(startAngle) * arcRadius;
            const startY = 120 + Math.sin(startAngle) * arcRadius;
            const endX = 120 + Math.cos(endAngle) * arcRadius;
            const endY = 120 + Math.sin(endAngle) * arcRadius;
            const largeArcFlag = index % 2 === 0 ? 0 : 1;
            const path = `M 120 120 L ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
            const isSelected = entry.digit === activeDigit;
            const fillColor = isSelected ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.12)';
            const strokeColor = isSelected ? 'rgba(239,68,68,0.75)' : 'rgba(148,163,184,0.4)';

            return (
              <g key={entry.digit}>
                <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={isSelected ? 1.5 : 1} />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {entry.digit}
                </text>
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-medium"
                >
                  {Number.isFinite(entry.percentage) ? `${entry.percentage.toFixed(0)}%` : '0%'}
                </text>
              </g>
            );
          })}

          <g transform={`translate(120 120) rotate(${pointerAngle})`} filter="url(#digit-spread-shadow)">
            <path d="M 0 -102 L 10 0 L -10 0 Z" fill="#ef4444" />
            <circle cx="0" cy="0" r="8" fill="#ef4444" opacity="0.9" />
          </g>
          <circle cx="120" cy="120" r="20" fill="rgba(15,23,42,0.04)" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
          <text x="120" y="128" textAnchor="middle" className="fill-foreground text-[11px] font-bold">{activeDigit}</text>
        </svg>
      </div>
    </div>
  );
}
