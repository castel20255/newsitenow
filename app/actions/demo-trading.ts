'use server';

import { WebSocket } from 'undici';
import { getPublicWsUrl } from '@deriv/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type DemoDurationUnit = 't' | 's' | 'm' | 'h' | 'd' | 'end-time';

export interface DemoTradeInput {
  symbol: string;
  contractType: 'CALL' | 'PUT' | 'CALLE' | 'PUTE';
  stake: number;
  duration: number;
  durationUnit: DemoDurationUnit;
  dateExpiry?: number;
}

function getProposalRequest(input: DemoTradeInput): Record<string, unknown> | null {
  if (!Number.isInteger(input.duration) || input.duration < 1) return null;
  if (input.durationUnit === 'end-time') {
    if (!Number.isInteger(input.dateExpiry)) return null;
    const remaining = (input.dateExpiry as number) - Math.floor(Date.now() / 1000);
    if (remaining < 1 || remaining > 31536000) return null;
    return { date_expiry: input.dateExpiry };
  }

  const units: Record<Exclude<DemoDurationUnit, 'end-time'>, string> = {
    t: 't',
    s: 's',
    m: 'm',
    h: 'm',
    d: 'd',
  };
  const duration = input.durationUnit === 'h' ? input.duration * 60 : input.duration;
  if (!Number.isInteger(duration) || duration < 1) return null;
  return { duration, duration_unit: units[input.durationUnit] };
}

function requestPublicDeriv<T>(payload: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket;
    try {
      socket = new WebSocket(getPublicWsUrl());
    } catch {
      reject(new Error('Market data is unavailable.'));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => finish(() => reject(new Error('Market data request timed out.'))), 8000);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch {}
      callback();
    };

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ ...payload, req_id: 1 }));
    });
    socket.addEventListener('message', event => {
      try {
        const response = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (response.req_id !== 1) return;
        if (response.error) {
          finish(() => reject(new Error('The market rejected this trade request.')));
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

interface ProposalResponse {
  proposal?: {
    ask_price: number;
    payout: number;
    spot: number;
    date_expiry: number;
  };
}

interface TickHistoryResponse {
  history?: { prices?: number[] };
}

export async function placeDemoTrade(input: DemoTradeInput) {
  const duration = getProposalRequest(input);
  if (
    !/^[A-Z0-9_]{2,32}$/.test(input.symbol) ||
    !['CALL', 'PUT', 'CALLE', 'PUTE'].includes(input.contractType) ||
    !Number.isFinite(input.stake) ||
    input.stake <= 0 ||
    input.stake > 10000 ||
    !duration
  ) {
    return { error: 'Trade details are invalid.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'Sign in to use your demo account.' };

    const marketProposal = await requestPublicDeriv<ProposalResponse>({
      proposal: 1,
      amount: input.stake,
      basis: 'stake',
      contract_type: input.contractType,
      currency: 'USD',
      underlying_symbol: input.symbol,
      ...duration,
    });

    const proposal = marketProposal.proposal;
    if (
      !proposal ||
      !Number.isFinite(proposal.spot) || proposal.spot <= 0 ||
      !Number.isFinite(proposal.payout) || proposal.payout < input.stake ||
      proposal.payout > input.stake * 1000 ||
      !Number.isInteger(proposal.date_expiry)
    ) {
      return { error: 'The market did not return a valid quote for this trade.' };
    }
    const durationSeconds = Math.ceil(proposal.date_expiry - Date.now() / 1000);
    if (durationSeconds < 1 || durationSeconds > 31536000) {
      return { error: 'The quoted contract expiry is invalid.' };
    }

    const { data, error } = await supabase.rpc('place_demo_trade', {
      p_symbol: input.symbol,
      p_contract_type: input.contractType,
      p_stake: input.stake,
      p_entry_quote: proposal.spot,
      p_expected_payout: proposal.payout,
      p_duration_seconds: durationSeconds,
    });
    if (error) {
      return { error: error.message.includes('Insufficient') ? 'Your demo balance is too low.' : 'Could not place the demo trade.' };
    }
    return { trade: Array.isArray(data) ? data[0] : data };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Market')) {
      return { error: 'Could not get a fresh market quote. Try again.' };
    }
    return { error: 'Demo trading is unavailable. Check your account and try again.' };
  }
}

export async function settleDemoTrade(tradeId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tradeId)) {
    return { error: 'Settlement details are invalid.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'Sign in to settle demo trades.' };

    const { data: trade, error: tradeError } = await supabase
      .from('paper_trades')
      .select('id, user_id, symbol, expires_at, status')
      .eq('id', tradeId)
      .maybeSingle();
    if (tradeError || !trade) return { error: 'Demo trade not found.' };
    if (trade.status !== 'open') return { result: { settled_status: trade.status } };
    if (Date.parse(trade.expires_at) > Date.now()) return { error: 'Demo trade has not expired.' };

    const quoteResponse = await requestPublicDeriv<TickHistoryResponse>({
      ticks_history: trade.symbol,
      style: 'ticks',
      count: 1,
      end: 'latest',
    });
    const exitQuote = quoteResponse.history?.prices?.at(-1);
    if (!Number.isFinite(exitQuote) || !exitQuote || exitQuote <= 0) {
      return { error: 'A fresh market quote is unavailable.' };
    }

    const { data, error } = await supabase.rpc('settle_demo_trade', {
      p_trade_id: tradeId,
      p_exit_quote: exitQuote,
    });
    if (error) return { error: 'Could not settle this demo trade.' };
    return { result: Array.isArray(data) ? data[0] : data };
  } catch {
    return { error: 'Demo settlement is temporarily unavailable. It will retry.' };
  }
}