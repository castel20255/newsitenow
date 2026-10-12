'use server';

import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface DigitTradeRecordInput {
  market_symbol: string;
  market_name: string;
  contract_type: string;
  prediction_digit: number | null;
  start_digit: number;
  stake: number;
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

    const { data, error } = await supabase.rpc('open_digit_market_trade', {
      p_market_symbol: input.market_symbol,
      p_market_name: input.market_name,
      p_contract_type: input.contract_type,
      p_prediction_digit: input.prediction_digit,
      p_start_digit: input.start_digit,
      p_stake: input.stake,
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
    if (!trade?.digit_market_trade_id) {
      return { error: 'The digit trade was not created.' };
    }

    return {
      success: true,
      tradeId: String(trade.digit_market_trade_id),
      balance: Number(trade.updated_balance),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be saved.' };
  }
}

export async function settleDigitTrade(tradeId: string, outcomeDigit: number) {
  if (!/^[0-9a-f-]{36}$/i.test(tradeId) || !Number.isInteger(outcomeDigit) || outcomeDigit < 0 || outcomeDigit > 9) {
    return { error: 'Trade details are invalid.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { error: 'Sign in to settle this digit trade.' };
    }

    const { data, error } = await supabase.rpc('settle_digit_market_trade', {
      p_trade_id: tradeId,
      p_outcome_digit: outcomeDigit,
    });
    if (error) return { error: error.message };

    const settlement = Array.isArray(data) ? data[0] : data;
    return {
      success: true,
      status: settlement?.settled_status,
      payout: Number(settlement?.credited_payout ?? 0),
      balance: Number(settlement?.updated_balance),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be settled.' };
  }
}
