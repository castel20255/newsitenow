import type { ActiveSymbol } from '@/lib/types';

export type MarketCategory = 'volatility' | 'forex' | 'crypto';
export type TradeMode = 'digits' | 'rise-fall' | 'market-only';

const CONTINUOUS_VOLATILITY_SYMBOLS = new Set([
  'R_10',
  'R_25',
  'R_50',
  'R_75',
  'R_100',
  '1HZ15V',
  '1HZ10V',
  '1HZ25V',
  '1HZ30V',
  '1HZ50V',
  '1HZ75V',
  '1HZ90V',
  '1HZ100V',
]);

const CRYPTO_SYMBOLS = new Set([
  'cryBTCUSD',
  'cryETHUSD',
  'cryLTCUSD',
  'cryBCHUSD',
  'cryXRPUSD',
  'cryADAUSD',
  'cryDOTUSD',
]);

export function filterSymbolsByCategory(
  symbols: ActiveSymbol[],
  category: MarketCategory
): ActiveSymbol[] {
  if (category === 'forex') {
    return symbols.filter(
      symbol => symbol.market === 'forex' && ['major_pairs', 'minor_pairs'].includes(symbol.submarket)
    );
  }

  if (category === 'crypto') {
    return symbols.filter(symbol => CRYPTO_SYMBOLS.has(symbol.underlying_symbol));
  }

  return symbols.filter(symbol => CONTINUOUS_VOLATILITY_SYMBOLS.has(symbol.underlying_symbol));
}