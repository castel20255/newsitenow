import 'server-only';

import { createPublicKey, publicEncrypt, constants } from 'node:crypto';

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';
const REQUEST_TIMEOUT_MS = 60_000;

export interface DarajaConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  stkCallbackUrl: string;
  transactionType: string;
}

export interface DarajaB2CConfig extends DarajaConfig {
  initiatorName: string;
  initiatorPassword: string;
  securityCertificate: string;
  resultUrl: string;
  timeoutUrl: string;
  commandId: string;
}

export class DarajaApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'DarajaApiError';
  }
}

let cachedToken: { token: string; expiresAt: number; cacheKey: string } | null = null;
let tokenRequest: Promise<string> | null = null;

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function requireHttpsUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getDarajaConfig(): DarajaConfig | null {
  const environment = (firstEnv('MPESA_ENVIRONMENT', 'ENVIRONMENT') || 'sandbox').toLowerCase();
  if (environment !== 'sandbox' && environment !== 'production') return null;

  const consumerKey = firstEnv('MPESA_CONSUMER_KEY');
  const consumerSecret = firstEnv('MPESA_CONSUMER_SECRET');
  const shortcode = firstEnv('MPESA_SHORTCODE');
  const passkey = firstEnv('MPESA_PASSKEY');
  const stkCallbackUrl = requireHttpsUrl(firstEnv('MPESA_CALLBACK_URL', 'CALLBACK_URL'));
  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !stkCallbackUrl) return null;

  return {
    baseUrl: environment === 'production' ? PRODUCTION_URL : SANDBOX_URL,
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    stkCallbackUrl,
    transactionType: firstEnv('MPESA_STK_TRANSACTION_TYPE') || 'CustomerPayBillOnline',
  };
}

export function getDarajaB2CConfig(): DarajaB2CConfig | null {
  const config = getDarajaConfig();
  if (!config) return null;

  const initiatorName = firstEnv('MPESA_INITIATOR_NAME');
  const initiatorPassword = firstEnv('MPESA_INITIATOR_PASSWORD');
  const encodedCertificate = firstEnv('MPESA_SECURITY_CERTIFICATE_BASE64');
  const resultUrl = requireHttpsUrl(firstEnv('MPESA_RESULT_URL', 'RESULT_URL'));
  const timeoutUrl = requireHttpsUrl(firstEnv('MPESA_QUEUE_TIMEOUT_URL', 'QUEUE_TIMEOUT_URL'));
  if (!initiatorName || !initiatorPassword || !encodedCertificate || !resultUrl || !timeoutUrl) return null;

  let securityCertificate = encodedCertificate;
  if (!encodedCertificate.includes('-----BEGIN CERTIFICATE-----')) {
    try {
      securityCertificate = Buffer.from(encodedCertificate, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
  if (!securityCertificate.includes('-----BEGIN CERTIFICATE-----')) return null;
  try {
    createPublicKey(securityCertificate);
  } catch {
    return null;
  }

  return {
    ...config,
    initiatorName,
    initiatorPassword,
    securityCertificate,
    resultUrl,
    timeoutUrl,
    commandId: firstEnv('MPESA_B2C_COMMAND_ID') || 'BusinessPayment',
  };
}

function timestamp(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

function callbackUrl(baseUrl: string, parameter: string, value: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(parameter, value);
  return url.toString();
}

function stkPassword(config: DarajaConfig, currentTimestamp: string): string {
  return Buffer.from(`${config.shortcode}${config.passkey}${currentTimestamp}`).toString('base64');
}

async function getAccessToken(config: DarajaConfig): Promise<string> {
  const cacheKey = `${config.baseUrl}:${config.consumerKey}`;
  if (cachedToken?.cacheKey === cacheKey && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(result) || typeof result.access_token !== 'string') {
      throw new DarajaApiError(response.status, getErrorMessage(result, 'Daraja OAuth authentication failed.'));
    }
    const expiresIn = Number(result.expires_in ?? 3600);
    cachedToken = {
      token: result.access_token,
      expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
      cacheKey,
    };
    return result.access_token;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

export async function ensureDarajaAccessToken(config: DarajaConfig): Promise<void> {
  await getAccessToken(config);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;
  const message = [value.errorMessage, value.error_description, value.message, value.errorCode]
    .find(candidate => typeof candidate === 'string' && candidate.trim());
  return typeof message === 'string' ? message.slice(0, 240) : fallback;
}

async function postDaraja(config: DarajaConfig, path: string, payload: Record<string, string | number>): Promise<unknown> {
  const accessToken = await getAccessToken(config);
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.warn('Daraja API request failed', { path, status: response.status });
    throw new DarajaApiError(response.status, getErrorMessage(result, 'Daraja rejected the request.'));
  }
  return result;
}

export function initiateStkPush(
  config: DarajaConfig,
  input: { amount: number; phoneNumber: string; reference: string }
): Promise<unknown> {
  const currentTimestamp = timestamp();
  const phoneNumber = input.phoneNumber.replace(/\D/g, '');
  const url = new URL(config.stkCallbackUrl);
  url.searchParams.set('reference', input.reference);

  return postDaraja(config, '/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config, currentTimestamp),
    Timestamp: currentTimestamp,
    TransactionType: config.transactionType,
    Amount: input.amount,
    PartyA: phoneNumber,
    PartyB: config.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: url.toString(),
    AccountReference: `W${input.reference.replace(/-/g, '').slice(0, 11)}`,
    TransactionDesc: 'Wallet deposit',
  });
}

export function queryStkPush(config: DarajaConfig, checkoutRequestId: string): Promise<unknown> {
  const currentTimestamp = timestamp();
  return postDaraja(config, '/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config, currentTimestamp),
    Timestamp: currentTimestamp,
    CheckoutRequestID: checkoutRequestId,
  });
}

function createSecurityCredential(config: DarajaB2CConfig): string {
  const publicKey = createPublicKey(config.securityCertificate);
  return publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(config.initiatorPassword)).toString('base64');
}

export async function ensureDarajaB2CReady(config: DarajaB2CConfig): Promise<void> {
  await getAccessToken(config);
  createSecurityCredential(config);
}

export function initiateB2CPayment(
  config: DarajaB2CConfig,
  input: { amount: number; phoneNumber: string; reference: string; callbackToken: string }
): Promise<unknown> {
  const phoneNumber = input.phoneNumber.replace(/\D/g, '');
  return postDaraja(config, '/mpesa/b2c/v1/paymentrequest', {
    InitiatorName: config.initiatorName,
    SecurityCredential: createSecurityCredential(config),
    CommandID: config.commandId,
    Amount: input.amount,
    PartyA: config.shortcode,
    PartyB: phoneNumber,
    Remarks: 'Wallet withdrawal',
    QueueTimeOutURL: callbackUrl(config.timeoutUrl, 'token', input.callbackToken),
    ResultURL: callbackUrl(config.resultUrl, 'token', input.callbackToken),
    Occasion: input.reference,
  });
}