'use server';

import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface DigitTradeRecordInput {
  market_symbol: string;
  market_name: string;
  contract_type: string;
  prediction_digit: number | null;
  outcome_digit: number;
  stake: number;
  payout: number;
  profit: number;
  win: boolean;
}

export async function recordDigitTrade(input: DigitTradeRecordInput) {
  const config = getSupabaseConfig();

  if (!config.isBrowserConfigured || !config.isServerConfigured) {
    return { skipped: true, reason: 'Supabase is not configured for this site yet.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { skipped: true, reason: 'User is not signed in.' };
    }

    const { error } = await supabase.from('digit_market_trades').insert({
      user_id: userData.user.id,
      market_symbol: input.market_symbol,
      market_name: input.market_name,
      contract_type: input.contract_type,
      prediction_digit: input.prediction_digit,
      outcome_digit: input.outcome_digit,
      stake: Number(input.stake.toFixed(2)),
      payout: Number(input.payout.toFixed(2)),
      profit: Number(input.profit.toFixed(2)),
      win: input.win,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be saved.' };
  }
}
