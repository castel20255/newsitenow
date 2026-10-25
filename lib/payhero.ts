import 'server-only';

const PAYHERO_API_URL = 'https://backend.payhero.co.ke/api/v2';

export interface PayHeroConfig {
  authToken: string;
  channelId: string;
  provider: string;
  networkCode: string;
  callbackUrl?: string;
}

export function getPayHeroConfig(): PayHeroConfig | null {
  const authToken = process.env.PAYHERO_AUTH_TOKEN?.trim();
  const channelId = process.env.PAYHERO_CHANNEL_ID?.trim();
  if (!authToken || !channelId) return null;

  return {
    authToken: authToken.replace(/^Basic\s+/i, ''),
    channelId,
    provider: process.env.PAYHERO_C2B_PROVIDER?.trim() || 'm-pesa',
    networkCode: process.env.PAYHERO_NETWORK_CODE?.trim() || '63902',
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
  if (!response.ok) throw new Error('PayHero request failed');
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
      phone_number: input.phoneNumber,
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
      phone_number: input.phoneNumber,
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