import { handleDarajaB2CResult } from '@/lib/daraja-wallet-callbacks';

export async function POST(request: Request) {
  return handleDarajaB2CResult(request);
}