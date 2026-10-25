import 'server-only';

export type WalletPaymentProvider = 'megapay' | 'payhero';

export function getWalletPaymentProvider(): WalletPaymentProvider | null {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || 'payhero';
  return provider === 'megapay' || provider === 'payhero' ? provider : null;
}