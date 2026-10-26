import 'server-only';

export type WalletPaymentProvider = 'megapay' | 'payhero' | 'daraja';

export function getWalletPaymentProvider(): WalletPaymentProvider {
  return 'megapay';
}