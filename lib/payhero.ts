import 'server-only';

const PAYHERO_API_URL = 'https://backend.payhero.co.ke/api/v2';

export interface PayHeroConfig {
  authToken: string;
  channelId: number;
  provider: string;
  networkCode: number;
  callbackUrl?: string;
}

export class PayHeroApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'PayHeroApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getPayHeroConfig(): PayHeroConfig | null {
  const authToken = process.env.PAYHERO_AUTH_TOKEN?.trim();
  const channelId = Number(process.env.PAYHERO_CHANNEL_ID?.trim());
  const networkCode = Number(process.env.PAYHERO_NETWORK_CODE?.trim() || '63902');
  if (!authToken || !Number.isSafeInteger(channelId) || channelId <= 0 || !Number.isSafeInteger(networkCode) || networkCode <= 0) return null;

  return {
    authToken: authToken.replace(/^Basic\s+/i, ''),
    channelId,
    provider: process.env.PAYHERO_C2B_PROVIDER?.trim() || 'm-pesa',
    networkCode,
    callbackUrl: process.env.PAYHERO_CALLBACK_URL?.trim() || undefined,
  };
}

async function requestPayHero(
  config: PayHeroConfig,
  endpoint: string,
  options: { method: 'GET' | 'POST'; payload?: Record<string, string | number> }
): Promise<unknown> {
  const url = new URL(`${PAYHERO_API_URL}/${endpoint}`);
  if (options.method === 'GET' && options.payload) {
    for (const [key, value] of Object.entries(options.payload)) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: options.method,
    headers: {
      Authorization: `Basic ${config.authToken}`,
      Accept: 'application/json',
      ...(options.payload && options.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.payload && options.method === 'POST' ? { body: JSON.stringify(options.payload) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = isRecord(result)
      ? ['error_message', 'message', 'error'].map(key => result[key]).find(value => typeof value === 'string')
      : null;
    const message = typeof errorMessage === 'string' ? errorMessage.slice(0, 240) : 'PayHero rejected the request.';
    console.warn('PayHero API request failed', { endpoint, status: response.status });
    throw new PayHeroApiError(response.status, message);
  }
  return result;
}

export function initiatePayHeroPayment(
  config: PayHeroConfig,
  input: { amount: number; phoneNumber: string; reference: string }
): Promise<unknown> {
  return requestPayHero(config, 'payments', {
    method: 'POST',
    payload: {
      amount: input.amount,
      phone_number: input.phoneNumber.replace(/^\+254/, '0').replace(/\D/g, ''),
      channel_id: config.channelId,
      provider: config.provider,
      external_reference: input.reference,
      ...(config.callbackUrl ? { callback_url: config.callbackUrl } : {}),
    },
  });
}

export function initiatePayHeroWithdrawal(
  config: PayHeroConfig,
  input: { amount: number; phoneNumber: string; reference: string }
): Promise<unknown> {
  return requestPayHero(config, 'withdraw', {
    method: 'POST',
    payload: {
      external_reference: input.reference,
      amount: input.amount,
      phone_number: input.phoneNumber.replace(/\D/g, ''),
      network_code: config.networkCode,
      ...(config.callbackUrl ? { callback_url: config.callbackUrl } : {}),
      channel: 'mobile',
      channel_id: config.channelId,
      payment_service: 'b2c',
    },
  });
}

export function getPayHeroTransactionStatus(config: PayHeroConfig, reference: string): Promise<unknown> {
  return requestPayHero(config, 'transaction-status', {
    method: 'GET',
    payload: { reference },
  });
}