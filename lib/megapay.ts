import 'server-only';

const MEGAPAY_API_URL = 'https://megapay.co.ke/backend/v1';

export interface MegaPayConfig {
  apiKey: string;
  email: string;
}

export class MegaPayApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'MegaPayApiError';
  }
}

export function getMegaPayConfig(): MegaPayConfig | null {
  const apiKey = process.env.MEGAPAY_API_KEY?.trim();
  const email = process.env.MEGAPAY_EMAIL?.trim();
  return apiKey && email ? { apiKey, email } : null;
}

export async function postMegaPay(
  endpoint: 'initiatestk' | 'transactionstatus',
  payload: Record<string, string | number>
): Promise<unknown> {
  const response = await fetch(`${MEGAPAY_API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = isRecord(result)
      ? ['error_message', 'message', 'error'].map(key => result[key]).find(value => typeof value === 'string')
      : null;
    throw new MegaPayApiError(response.status, typeof errorMessage === 'string' ? errorMessage.slice(0, 240) : 'MegaPay rejected the request.');
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}