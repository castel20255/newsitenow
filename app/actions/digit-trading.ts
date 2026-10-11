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
  duration_ticks?: number;
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

    const { data, error } = await supabase.rpc('place_digit_market_trade', {
      p_market_symbol: input.market_symbol,
      p_market_name: input.market_name,
      p_contract_type: input.contract_type,
      p_prediction_digit: input.prediction_digit,
      p_outcome_digit: input.outcome_digit,
      p_stake: input.stake,
      p_payout: input.payout,
      p_duration_ticks: input.duration_ticks ?? 1,
    });

    if (error) {
      if (error.message.includes('Insufficient')) {
        return { error: 'Insufficient demo balance for this trade.' };
      }
      if (error.message.includes('Demo account unavailable')) {
        return { error: 'Demo account is not available.' };
      }
      return { error: error.message };
    }

    const trade = Array.isArray(data) ? data[0] : data;
    return { success: true, balance: Number(trade?.updated_balance) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be saved.' };
  }
}
