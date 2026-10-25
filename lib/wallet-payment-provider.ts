import 'server-only';

export type WalletPaymentProvider = 'megapay' | 'payhero';

export function getWalletPaymentProvider(): WalletPaymentProvider {
  return 'payhero';
}