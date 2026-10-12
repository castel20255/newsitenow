import type { DerivWS } from '@deriv/core';

interface MarketTickMessage {
  msg_type?: string;
  tick?: {
    symbol?: string;
    quote?: number;
    pip_size?: number;
    id?: string;
    epoch?: number;
  };
}

function getLastDisplayedDigit(quote: number, pipSize: number): number {
  const precision = Math.max(0, Math.min(10, Math.trunc(pipSize)));
  const formattedQuote = quote.toFixed(precision);
  return Number(formattedQuote.replace('.', '').slice(-1)) || 0;
}

export function waitForMarketTicks(
  ws: DerivWS,
  symbol: string,
  tickCount: number
): Promise<number> {
  if (!Number.isSafeInteger(tickCount) || tickCount < 1) {
    return Promise.reject(new Error('Enter a valid tick duration.'));
  }

  return new Promise<number>((resolve) => {
    let receivedTicks = 0;
    const seenTickIds = new Set<string>();
    const unsubscribe = ws.onMessage(message => {
      const tickMessage = message as MarketTickMessage;
      const tick = tickMessage.tick;
      if (tickMessage.msg_type !== 'tick' || tick?.symbol !== symbol) return;
      if (typeof tick.quote !== 'number' || !Number.isFinite(tick.quote)) return;

      const tickId = tick.id ?? `${tick.epoch ?? 'unknown'}:${tick.quote}`;
      if (seenTickIds.has(tickId)) return;
      seenTickIds.add(tickId);

      receivedTicks += 1;
      if (receivedTicks < tickCount) return;

      unsubscribe();
      resolve(getLastDisplayedDigit(tick.quote, tick.pip_size ?? 2));
    });
  });
}