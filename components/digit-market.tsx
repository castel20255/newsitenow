'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MIN_TRADE_STAKE } from '@/lib/trading-constants';

type Market = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  volatility: number;
};

type ContractType = 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCH' | 'DIFFER';

const OVER_PAYOUTS: Record<number, number> = {
  0: 22,
  1: 33,
  2: 43,
  3: 54,
  4: 65,
  5: 76,
  6: 93,
  7: 148,
  8: 297,
};

const UNDER_PAYOUTS: Record<number, number> = {
  9: 22,
  8: 33,
  7: 43,
  6: 54,
  5: 65,
  4: 76,
  3: 93,
  2: 148,
  1: 297,
};

const MATCH_PAYOUT = 347.765;
const DIFFER_PAYOUT = 19;
const EVEN_ODD_PAYOUT = 87;

function getLastDigit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  if (!text.includes('.')) {
    return Number.parseInt(text.slice(-1), 10) || 0;
  }

  const decimals = text.split('.')[1] ?? '0';
  const lastChar = decimals.trim().slice(-1) || '0';
  return Number.parseInt(lastChar, 10) || 0;
}

function getPayoutMultiplier(contractType: ContractType, selectedDigit: number): number {
  switch (contractType) {
    case 'EVEN':
    case 'ODD':
      return 1 + EVEN_ODD_PAYOUT / 100;
    case 'MATCH':
      return 1 + MATCH_PAYOUT / 100;
    case 'DIFFER':
      return 1 + DIFFER_PAYOUT / 100;
    case 'OVER':
      return 1 + (OVER_PAYOUTS[selectedDigit] ?? 0) / 100;
    case 'UNDER':
      return 1 + (UNDER_PAYOUTS[selectedDigit] ?? 0) / 100;
    default:
      return 1;
  }
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

type TradeState = {
  outcomeDigit: number;
  win: boolean;
  payout: number;
  profit: number;
  contractType: ContractType;
  predictionDigit: number;
  marketName: string;
  marketSymbol: string;
};

export function DigitMarket() {
  const [markets, setMarkets] = useState<Market[]>([
    { id: 'eurusd', name: 'EUR/USD', symbol: 'EURUSD', price: 1.2047, volatility: 0.0005 },
    { id: 'gold', name: 'Gold', symbol: 'XAUUSD', price: 2137.682, volatility: 0.85 },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTCUSD', price: 64128.374, volatility: 7.5 },
    { id: 'apple', name: 'Apple', symbol: 'AAPL', price: 185.376, volatility: 0.2 },
  ]);
  const [selectedMarketId, setSelectedMarketId] = useState('eurusd');
  const [selectedContract, setSelectedContract] = useState<ContractType>('OVER');
  const [selectedDigit, setSelectedDigit] = useState(0);
  const [stake, setStake] = useState('1');
  const [tradeState, setTradeState] = useState<TradeState | null>(null);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const marketPricesRef = useRef(markets);
  const tickListenersRef = useRef(new Map<string, Set<(price: number) => void>>());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextMarkets = marketPricesRef.current.map((market) => {
        const drift = (Math.random() - 0.5) * market.volatility;
        const nextPrice = Number(Math.max(market.price + drift, 0.0001).toFixed(4));
        return { ...market, price: nextPrice };
      });
      marketPricesRef.current = nextMarkets;
      setMarkets(nextMarkets);
      for (const market of nextMarkets) {
        const listeners = tickListenersRef.current.get(market.symbol);
        listeners?.forEach(listener => listener(market.price));
      }
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  const waitForMarketTicks = (symbol: string, tickCount: number) => new Promise<{ price: number; digit: number }>((resolve) => {
    let receivedTicks = 0;
    const listeners = tickListenersRef.current.get(symbol) ?? new Set<(price: number) => void>();
    const onTick = (price: number) => {
      receivedTicks += 1;
      if (receivedTicks < tickCount) return;
      listeners.delete(onTick);
      if (listeners.size === 0) tickListenersRef.current.delete(symbol);
      resolve({ price, digit: getLastDigit(price) });
    };
    listeners.add(onTick);
    tickListenersRef.current.set(symbol, listeners);
  });

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) ?? markets[0],
    [markets, selectedMarketId]
  );

  const currentLastDigit = useMemo(
    () => getLastDigit(selectedMarket.price),
    [selectedMarket.price]
  );

  const distribution = useMemo(() => {
    const counts = Array.from({ length: 10 }, () => 0);
    markets.forEach((market) => {
      counts[getLastDigit(market.price)] += 1;
    });
    return counts;
  }, [markets]);

  const maxDistribution = Math.max(...distribution, 1);
  const triangleLeft = ((currentLastDigit + 0.5) / 10) * 100;

  const validDigits = useMemo(() => {
    if (selectedContract === 'OVER') return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    if (selectedContract === 'UNDER') return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }, [selectedContract]);

  useEffect(() => {
    if (!validDigits.includes(selectedDigit)) {
      setSelectedDigit(validDigits[0]);
    }
  }, [selectedDigit, validDigits]);

  const payoutMultiplier = useMemo(
    () => getPayoutMultiplier(selectedContract, selectedDigit),
    [selectedContract, selectedDigit]
  );

  const payoutPreview = useMemo(() => {
    const stakeValue = Number(stake) || 0;
    return stakeValue > 0 ? stakeValue * payoutMultiplier : 0;
  }, [payoutMultiplier, stake]);

  const contractOptions: Array<{ value: ContractType; label: string; description: string }> = [
    { value: 'OVER', label: 'Over', description: 'Higher than the selected digit' },
    { value: 'UNDER', label: 'Under', description: 'Lower than the selected digit' },
    { value: 'EVEN', label: 'Even', description: 'Last digit is even' },
    { value: 'ODD', label: 'Odd', description: 'Last digit is odd' },
    { value: 'MATCH', label: 'Matches', description: 'Exact digit match' },
    { value: 'DIFFER', label: 'Differs', description: 'Anything except your digit' },
  ];

  const handlePlaceTrade = async () => {
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake < MIN_TRADE_STAKE) {
      setTradeMessage(`Minimum stake is $${MIN_TRADE_STAKE.toFixed(2)}.`);
      return;
    }

    setIsPlacingTrade(true);
    setTradeMessage('');

    try {
      const outcome = await waitForMarketTicks(selectedMarket.symbol, 1);
      const win = (() => {
        switch (selectedContract) {
          case 'OVER': return outcome.digit > selectedDigit;
          case 'UNDER': return outcome.digit < selectedDigit;
          case 'EVEN': return outcome.digit % 2 === 0;
          case 'ODD': return outcome.digit % 2 === 1;
          case 'MATCH': return outcome.digit === selectedDigit;
          case 'DIFFER': return outcome.digit !== selectedDigit;
        }
      })();
      const outcomeDigit = outcome.digit;
      const totalPayout = win ? Number((numericStake * getPayoutMultiplier(selectedContract, selectedDigit)).toFixed(2)) : 0;
      const netProfit = win ? totalPayout - numericStake : -numericStake;
      const payload = {
        market_symbol: selectedMarket.symbol,
        market_name: selectedMarket.name,
        contract_type: selectedContract,
        prediction_digit: ['EVEN', 'ODD'].includes(selectedContract) ? null : selectedDigit,
        outcome_digit: outcomeDigit,
        stake: Number(numericStake.toFixed(2)),
        payout: totalPayout,
        profit: Number(netProfit.toFixed(2)),
        win,
      };

      const localTrades = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('digit-market-history') ?? '[]') : [];
      const entry = { ...payload, created_at: new Date().toISOString() };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('digit-market-history', JSON.stringify([entry, ...localTrades].slice(0, 20)));
      }

      setTradeState({
        outcomeDigit,
        win,
        payout: totalPayout,
        profit: Number(netProfit.toFixed(2)),
        contractType: selectedContract,
        predictionDigit: ['EVEN', 'ODD'].includes(selectedContract) ? outcomeDigit % 2 === 0 ? 0 : 1 : selectedDigit,
        marketName: selectedMarket.name,
        marketSymbol: selectedMarket.symbol,
      });
      setTradeMessage('');
    } catch {
      setTradeMessage('Trade could not be completed.');
    } finally {
      setIsPlacingTrade(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Digit market</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Last digit trader</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            Market feed live
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card className="overflow-hidden border-border bg-card/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Market overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {markets.map((market) => {
                  const isActive = market.id === selectedMarketId;
                  return (
                    <button
                      key={market.id}
                      type="button"
                      onClick={() => setSelectedMarketId(market.id)}
                      className={[
                        'rounded-xl border p-3 text-left transition-all',
                        isActive
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-muted/70',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        <span>{market.symbol}</span>
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{market.name}</span>
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-foreground">{formatValue(market.price)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Last digit: {getLastDigit(market.price)}</div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Selected market</p>
                    <h2 className="mt-1 text-3xl font-semibold">{selectedMarket.name}</h2>
                  </div>
                  <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right ring-1 ring-primary/20">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-primary">Price</div>
                    <div className="text-2xl font-bold text-primary">{formatValue(selectedMarket.price)}</div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
                  <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Distribution</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">Current last digit: {currentLastDigit}</span>
                  </div>

                  <div className="grid grid-cols-10 gap-2">
                    {distribution.map((count, digit) => {
                      const isCurrent = digit === currentLastDigit;
                      const height = `${Math.max((count / maxDistribution) * 100, 16)}%`;

                      return (
                        <div key={digit} className="flex flex-col items-center gap-2">
                          <div className="flex h-24 w-full items-end justify-center rounded-xl bg-muted/50 p-1">
                            <div
                              className={[
                                'w-full rounded-t-lg transition-all',
                                isCurrent ? 'bg-primary shadow-[0_0_0_1px_rgba(13,148,136,0.2)]' : 'bg-muted-foreground/20',
                              ].join(' ')}
                              style={{ height }}
                            />
                          </div>
                          <span className={isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}>{digit}</span>
                          <span className="text-[10px] text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative mt-5 h-6">
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                    <div
                      className="absolute top-0 h-0 w-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-500"
                      style={{ left: `calc(${triangleLeft}% - 8px)` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Trade controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contract type</div>
                <div className="grid grid-cols-2 gap-2">
                  {contractOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selectedContract === option.value ? 'default' : 'outline'}
                      className="h-auto flex-col items-center justify-center rounded-xl px-3 py-3"
                      onClick={() => setSelectedContract(option.value)}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-[10px] opacity-80">{option.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Prediction</div>
                {(selectedContract === 'OVER' || selectedContract === 'UNDER') && (
                  <div className="grid grid-cols-5 gap-2">
                    {validDigits.map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        variant={selectedDigit === digit ? 'default' : 'outline'}
                        className="h-10 rounded-xl"
                        onClick={() => setSelectedDigit(digit)}
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>
                )}

                {(selectedContract === 'MATCH' || selectedContract === 'DIFFER') && (
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        variant={selectedDigit === digit ? 'default' : 'outline'}
                        className="h-10 rounded-xl"
                        onClick={() => setSelectedDigit(digit)}
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>
                )}

                {['EVEN', 'ODD'].includes(selectedContract) && (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        variant={selectedDigit === digit ? 'default' : 'outline'}
                        className="h-10 rounded-xl"
                        onClick={() => setSelectedDigit(digit)}
                        disabled
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stake</div>
                <Input
                  type="number"
                  min={MIN_TRADE_STAKE}
                  step={0.01}
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="rounded-2xl border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Projected payout</span>
                  <span className="text-base font-semibold text-foreground">${payoutPreview.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Profit</span>
                  <span className="text-base font-semibold text-primary">+{(payoutPreview - Number(stake || 0)).toFixed(2)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Win rate multiplier: {payoutMultiplier.toFixed(2)}x
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => void handlePlaceTrade()}
                disabled={isPlacingTrade}
              >
                {isPlacingTrade ? 'Placing trade...' : 'Place digit trade'}
              </Button>

              {tradeState && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">Last outcome</span>
                    <span className={tradeState.win ? 'text-primary' : 'text-destructive'}>
                      {tradeState.win ? 'Win' : 'Loss'}
                    </span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Outcome digit: <span className="font-semibold text-foreground">{tradeState.outcomeDigit}</span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Payout: <span className="font-semibold text-foreground">${tradeState.payout.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Profit: <span className={tradeState.profit >= 0 ? 'font-semibold text-primary' : 'font-semibold text-destructive'}>
                      {tradeState.profit >= 0 ? '+' : ''}${tradeState.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {tradeMessage && (
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {tradeMessage}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
