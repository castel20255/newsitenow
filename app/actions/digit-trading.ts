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

    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id, balance')
      .eq('user_id', userData.user.id)
      .eq('account_type', 'demo')
      .maybeSingle();

    if (accountError || !account) {
      return { skipped: true, reason: 'Demo account is not available.' };
    }

    const stake = Number(input.stake.toFixed(2));
    const currentBalance = Number(account.balance ?? 0);
    if (currentBalance < stake) {
      return { skipped: true, reason: 'Insufficient demo balance for this trade.' };
    }

    const nextBalance = Number((currentBalance - stake).toFixed(2));
    const { error: accountUpdateError } = await supabase
      .from('trading_accounts')
      .update({ balance: nextBalance })
      .eq('id', account.id);

    if (accountUpdateError) {
      return { error: accountUpdateError.message };
    }

    const { error: txError } = await supabase.from('wallet_transactions').insert({
      user_id: userData.user.id,
      account_id: account.id,
      transaction_type: 'demo_stake',
      amount: -stake,
      balance_after: nextBalance,
    });

    if (txError) {
      return { error: txError.message };
    }

    const durationTicks = Number((input as { duration_ticks?: number }).duration_ticks ?? 1);
    const expiresAt = new Date(Date.now() + Math.max(1, durationTicks) * 3000).toISOString();

    const { data: trade, error } = await supabase.from('digit_market_trades').insert({
      user_id: userData.user.id,
      market_symbol: input.market_symbol,
      market_name: input.market_name,
      contract_type: input.contract_type,
      prediction_digit: input.prediction_digit,
      outcome_digit: input.outcome_digit,
      stake,
      payout: Number(input.payout.toFixed(2)),
      profit: Number(input.profit.toFixed(2)),
      win: input.win,
      duration_ticks: Math.max(1, Number.isFinite(durationTicks) ? Math.round(durationTicks) : 1),
      expires_at: expiresAt,
      status: 'open',
    }).select('id').single();

    if (error) {
      return { error: error.message };
    }

    if (trade?.id) {
      await supabase.from('wallet_transactions').insert({
        user_id: userData.user.id,
        account_id: account.id,
        transaction_type: 'demo_payout',
        amount: 0,
        balance_after: nextBalance,
        reference_id: trade.id,
      });
    }

    return { success: true, balance: nextBalance };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be saved.' };
  }
}
