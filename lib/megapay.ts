import 'server-only';

const MEGAPAY_API_URL = 'https://megapay.co.ke/backend/v1';

export interface MegaPayConfig {
  apiKey: string;
  email: string;
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
  if (!response.ok) throw new Error('MegaPay request failed');
  return result;
}