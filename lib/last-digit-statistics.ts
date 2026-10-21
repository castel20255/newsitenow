export interface DigitFrequency {
  count: number;
  percentage: number;
}

export interface LastDigitStatistics {
  total_ticks: number;
  digits: Record<`${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`, DigitFrequency>;
}

export type DigitStatisticsUpdateHandler = (statistics: LastDigitStatistics) => void;

export const DEFAULT_DIGIT_WINDOW_SIZE = 1000;

function toPlainDecimal(value: string): string | null {
  const cleaned = value.trim().replace(/,/g, '').replace(/[^\d.eE+-]/g, '');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return null;

  const numericValue = Number(cleaned);
  if (!Number.isFinite(numericValue)) return null;

  const [mantissa, exponentText] = cleaned.toLowerCase().split('e');
  const exponent = exponentText ? Number(exponentText) : 0;
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null;

  const unsignedMantissa = mantissa.replace(/^[+-]/, '');
  const decimalIndex = unsignedMantissa.indexOf('.');
  const integerDigits = decimalIndex === -1 ? unsignedMantissa.length : decimalIndex;
  const digits = unsignedMantissa.replace('.', '');
  const shiftedDecimalIndex = integerDigits + exponent;

  if (shiftedDecimalIndex <= 0) {
    return `0.${'0'.repeat(-shiftedDecimalIndex)}${digits}`;
  }
  if (shiftedDecimalIndex >= digits.length) {
    return `${digits}${'0'.repeat(shiftedDecimalIndex - digits.length)}`;
  }
  return `${digits.slice(0, shiftedDecimalIndex)}.${digits.slice(shiftedDecimalIndex)}`;
}

export function extractLastDigit(price: number | string, precision?: number): number | null {
  if (typeof price !== 'number' && typeof price !== 'string') return null;
  if (typeof price === 'number' && !Number.isFinite(price)) return null;

  let priceText: string;
  const validPrecision = Number.isInteger(precision) && precision! >= 0 && precision! <= 20;
  if (typeof price === 'number' && validPrecision) {
    priceText = Math.abs(price).toFixed(precision);
  } else {
    const plainDecimal = toPlainDecimal(String(price));
    if (!plainDecimal) return null;
    priceText = plainDecimal;
  }

  const digits = priceText.replace(/\D/g, '');
  const lastCharacter = digits.at(-1);
  return lastCharacter ? Number(lastCharacter) : null;
}

function emptyStatistics(): LastDigitStatistics {
  const digits = Object.fromEntries(
    Array.from({ length: 10 }, (_, digit) => [String(digit), { count: 0, percentage: 0 }])
  ) as LastDigitStatistics['digits'];
  return { total_ticks: 0, digits };
}

export class LastDigitStatisticsCalculator {
  private readonly window: number[] = [];
  private readonly counts = Array.from({ length: 10 }, () => 0);

  constructor(
    private readonly windowSize = DEFAULT_DIGIT_WINDOW_SIZE,
    private readonly onUpdate?: DigitStatisticsUpdateHandler
  ) {
    if (!Number.isSafeInteger(windowSize) || windowSize < 1) {
      throw new RangeError('Window size must be a positive safe integer.');
    }
  }

  pushTick(price: number | string, precision?: number): LastDigitStatistics | null {
    const digit = extractLastDigit(price, precision);
    if (digit === null) return null;

    this.addDigit(digit);
    const statistics = this.getStatistics();
    try {
      this.onUpdate?.(statistics);
    } catch {
      // A consumer callback must not interrupt live tick processing.
    }
    return statistics;
  }

  loadHistory(prices: readonly (number | string)[], precision?: number): LastDigitStatistics {
    this.window.length = 0;
    this.counts.fill(0);

    for (const price of prices.slice(-this.windowSize)) {
      const digit = extractLastDigit(price, precision);
      if (digit !== null) this.addDigit(digit);
    }

    return this.getStatistics();
  }

  getStatistics(): LastDigitStatistics {
    const totalTicks = this.window.length;
    const statistics = emptyStatistics();
    statistics.total_ticks = totalTicks;

    for (let digit = 0; digit <= 9; digit += 1) {
      const frequency = statistics.digits[String(digit) as keyof LastDigitStatistics['digits']];
      frequency.count = this.counts[digit];
      frequency.percentage = totalTicks === 0 ? 0 : (this.counts[digit] / totalTicks) * 100;
    }

    return statistics;
  }

  private addDigit(digit: number): void {
    this.window.push(digit);
    this.counts[digit] += 1;
    if (this.window.length > this.windowSize) {
      const discardedDigit = this.window.shift();
      if (discardedDigit !== undefined) this.counts[discardedDigit] -= 1;
    }
  }
}