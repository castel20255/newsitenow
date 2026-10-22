'use server';

import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublicWsUrl } from '@deriv/core';
import { MIN_TRADE_STAKE } from '@/lib/trading-constants';
import { WebSocket } from 'undici';

export interface DigitTradeRecordInput {
  market_symbol: string;
  market_name: string;
  contract_type: string;
  prediction_digit: number | null;
  entry_price: number;
  price_precision: number;
  stake: number;
  duration_ticks?: number;
  fundingSource?: 'demo' | 'app_wallet';
}

interface TickHistoryResponse {
  req_id?: number;
  error?: { message?: string };
  history?: { prices?: number[]; times?: number[] };
}

interface TickResponse {
  req_id?: number;
  error?: { message?: string };
  tick?: { symbol?: string; quote?: number; pip_size?: number; epoch?: number };
}

function requestPublicDeriv<T>(payload: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket;
    try {
      socket = new WebSocket(getPublicWsUrl());
    } catch {
      reject(new Error('Could not connect to the public market feed.'));
      return;
    }

    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch {}
      callback();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('Market price request timed out.'))), 8000);

    socket.addEventListener('open', () => socket.send(JSON.stringify({ ...payload, req_id: 1 })));
    socket.addEventListener('message', event => {
      try {
        const response = JSON.parse(String(event.data)) as T & { req_id?: number; error?: { message?: string } };
        if (response.req_id !== 1) return;
        if (response.error) {
          finish(() => reject(new Error(response.error?.message ?? 'Market tick request failed.')));
          return;
        }
        finish(() => resolve(response as T));
      } catch {
        finish(() => reject(new Error('The market returned an invalid response.')));
      }
    });
    socket.addEventListener('error', () => finish(() => reject(new Error('Could not connect to the public market feed.'))));
    socket.addEventListener('close', () => {
      if (!settled) finish(() => reject(new Error('The public market connection closed.')));
    });
  });
}

async function getLatestPublicTick(symbol: string): Promise<{ price: number; precision: number; epoch: number }> {
  const response = await requestPublicDeriv<TickResponse>({ ticks: symbol, subscribe: 1 });
  const price = response.tick?.quote;
  const pipSize = response.tick?.pip_size;
  const epoch = response.tick?.epoch;
  if (response.tick?.symbol !== symbol || !Number.isFinite(price) || !price || price <= 0 || !Number.isInteger(pipSize) || (pipSize as number) < 0 || (pipSize as number) > 10 || !Number.isSafeInteger(epoch) || (epoch as number) <= 0) {
    throw new Error('The market returned an invalid tick.');
  }
  return { price, precision: pipSize as number, epoch: epoch as number };
}

async function getDigitExitPrice(
  symbol: string,
  entryEpoch: number,
  durationTicks: number
): Promise<number | null> {
  if (!Number.isSafeInteger(entryEpoch) || entryEpoch <= 0) throw new Error('Digit trade entry tick is invalid.');

  const response = await requestPublicDeriv<TickHistoryResponse>({
    ticks_history: symbol,
    style: 'ticks',
    start: entryEpoch,
    end: 'latest',
  });
  const prices = response.history?.prices ?? [];
  const times = response.history?.times ?? [];
  const followingTicks = prices.filter((price, index) =>
    Number.isFinite(price) && price > 0 && Number.isFinite(times[index]) && times[index] > entryEpoch
  );
  return followingTicks.length >= durationTicks ? followingTicks[durationTicks - 1] : null;
}

export async function recordDigitTrade(input: DigitTradeRecordInput) {
  const durationTicks = input.duration_ticks ?? 1;
  if (
    !/^[A-Z0-9_]{2,32}$/.test(input.market_symbol.toUpperCase()) ||
    !Number.isFinite(input.stake) || input.stake < MIN_TRADE_STAKE || input.stake > 10000 ||
    !Number.isSafeInteger(durationTicks) || durationTicks < 1 || durationTicks > 100
  ) {
    if (!Number.isFinite(input.stake) || input.stake < MIN_TRADE_STAKE) {
    return { error: `Minimum stake is $${MIN_TRADE_STAKE.toFixed(2)}.` };
    }
    return { error: 'Trade details are invalid.' };
  }

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

    const entryTick = await getLatestPublicTick(input.market_symbol.toUpperCase());
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('open_digit_market_trade_at_tick', {
      p_market_symbol: input.market_symbol.toUpperCase(),
      p_market_name: input.market_name,
      p_contract_type: input.contract_type,
      p_prediction_digit: input.prediction_digit,
      p_entry_price: entryTick.price,
      p_price_precision: entryTick.precision,
      p_entry_epoch: entryTick.epoch,
      p_stake: input.stake,
      p_duration_ticks: durationTicks,
      p_funding_source: input.fundingSource ?? 'demo',
      p_user_id: userData.user.id,
    });

    if (error) {
      if (error.message.includes('Insufficient')) {
        return { error: input.fundingSource === 'app_wallet' ? 'Insufficient Real Wallet balance for this trade.' : 'Insufficient demo balance for this trade.' };
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

export async function settleDigitTrade(tradeId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tradeId)) {
    return { error: 'Trade details are invalid.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { error: 'Sign in to settle this digit trade.' };
    }

    const { data: trade, error: tradeError } = await supabase
      .from('digit_market_trades')
      .select('market_symbol, duration_ticks, price_precision, entry_epoch, outcome_digit, payout, created_at, status')
      .eq('id', tradeId)
      .maybeSingle();
    if (tradeError || !trade) return { error: 'Digit trade not found.' };
    if (trade.status !== 'open') {
      return {
        success: true,
        status: trade.status,
        payout: Number(trade.payout),
        outcomeDigit: Number(trade.outcome_digit),
      };
    }
    if (!Number.isSafeInteger(trade.duration_ticks) || trade.duration_ticks < 1 || trade.duration_ticks > 100) {
      return { error: 'Digit trade duration is invalid.' };
    }

    const fallbackTick = Number.isInteger(trade.price_precision)
      ? null
      : await getLatestPublicTick(trade.market_symbol);
    const pricePrecision = Number.isInteger(trade.price_precision)
      ? Number(trade.price_precision)
      : fallbackTick?.precision;
    if (pricePrecision === undefined || pricePrecision < 0 || pricePrecision > 10) {
      return { error: 'Digit trade precision is invalid.' };
    }
    const storedEntryEpoch = Number(trade.entry_epoch);
    const entryEpoch = Number.isSafeInteger(storedEntryEpoch) && storedEntryEpoch > 0
      ? storedEntryEpoch
      : Math.floor(Date.parse(trade.created_at) / 1000);
    const exitPrice = await getDigitExitPrice(trade.market_symbol, entryEpoch, trade.duration_ticks);
    if (exitPrice === null) return { pending: true, retryAfterMs: 250 };
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('settle_digit_market_trade', {
      p_trade_id: tradeId,
      p_exit_price: exitPrice,
      p_price_precision: pricePrecision,
      p_user_id: userData.user.id,
    });
    if (error) return { error: 'Could not settle this digit trade.' };

    const settlement = Array.isArray(data) ? data[0] : data;
    return {
      success: true,
      status: settlement?.settled_status,
      payout: Number(settlement?.credited_payout ?? 0),
      balance: Number(settlement?.updated_balance),
      outcomeDigit: Number(settlement?.outcome_digit),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Trade could not be settled.' };
  }
}
