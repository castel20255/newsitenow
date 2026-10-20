'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { signOutAccount } from '@/app/actions/account-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { SupabaseBrowserConfig } from '@/lib/supabase/types';

export type SiteAccountType = 'demo' | 'real' | 'app_wallet';
export type SiteAuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'unconfigured' | 'error';

export interface SiteProfile {
  id: string;
  username: string;
  full_name: string;
  country_code: string;
  country_name: string;
  phone_e164: string;
  terms_accepted_at: string;
}

export interface SiteTradingAccount {
  id: string;
  user_id: string;
  account_type: SiteAccountType;
  currency: string;
  balance: number | string;
  status: 'active' | 'provider_required';
}

export type SiteTradeContractType =
  | 'CALL' | 'PUT' | 'CALLE' | 'PUTE'
  | 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCH' | 'DIFFER';

export interface SitePaperTrade {
  id: string;
  user_id: string;
  account_id: string | null;
  funding_source?: 'demo' | 'app_wallet';
  symbol: string;
  contract_type: SiteTradeContractType;
  stake: number | string;
  entry_quote: number | string | null;
  price_precision?: number;
  expected_payout: number | string;
  duration_seconds: number;
  expires_at: string;
  status: 'open' | 'won' | 'lost';
  exit_quote: number | string | null;
  payout: number | string;
  created_at: string;
  settled_at: string | null;
}

interface SiteAuthContextValue {
  authState: SiteAuthState;
  user: User | null;
  profile: SiteProfile | null;
  accounts: SiteTradingAccount[];
  isAdmin: boolean;
  paperTrades: SitePaperTrade[];
  digitTrades: SitePaperTrade[];
  activeAccount: SiteTradingAccount | null;
  isConfigured: boolean;
  authDialogOpen: boolean;
  authDialogMode: 'login' | 'signup';
  openAuth: (mode: 'login' | 'signup') => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
  switchAccount: (accountId: string) => void;
  refresh: () => Promise<void>;
}

const SiteAuthContext = createContext<SiteAuthContextValue | null>(null);
const ACTIVE_ACCOUNT_KEY = 'site-active-trading-account';

export function SiteAuthProvider({
  children,
  supabaseConfig,
}: {
  children: React.ReactNode;
  supabaseConfig: SupabaseBrowserConfig | null;
}) {
  const isConfigured = Boolean(supabaseConfig);
  const [authState, setAuthState] = useState<SiteAuthState>(isConfigured ? 'loading' : 'unconfigured');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [accounts, setAccounts] = useState<SiteTradingAccount[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [paperTrades, setPaperTrades] = useState<SitePaperTrade[]>([]);
  const [digitTrades, setDigitTrades] = useState<SitePaperTrade[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('signup');

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient(supabaseConfig);
    if (!supabase) {
      setAuthState('unconfigured');
      setUser(null);
      setProfile(null);
      setAccounts([]);
      setIsAdmin(false);
      setPaperTrades([]);
      setDigitTrades([]);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUser(null);
        setProfile(null);
        setAccounts([]);
        setIsAdmin(false);
        setPaperTrades([]);
        setDigitTrades([]);
        setActiveAccountId(null);
        setAuthState('unauthenticated');
        return;
      }

      const [profileResult, accountsResult, tradesResult, digitTradesResult, adminResult, walletResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle(),
        supabase.from('trading_accounts').select('*').eq('user_id', userData.user.id),
        supabase.from('paper_trades').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('digit_market_trades').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('site_admins').select('email').eq('email', userData.user.email?.toLowerCase() ?? '').maybeSingle(),
        supabase.from('app_wallets').select('balance_usd').eq('user_id', userData.user.id).maybeSingle(),
      ]);
      if (profileResult.error || accountsResult.error || tradesResult.error || digitTradesResult.error || walletResult.error || !profileResult.data) {
        setAuthState('error');
        return;
      }

      const nextAccounts = [
        ...((accountsResult.data ?? []) as unknown as SiteTradingAccount[]),
        {
          id: 'app-wallet',
          user_id: userData.user.id,
          account_type: 'app_wallet' as const,
          currency: 'USD',
          balance: Number(walletResult.data?.balance_usd ?? 0),
          status: 'active' as const,
        },
      ];
      const nextTrades = (tradesResult.data ?? []) as unknown as SitePaperTrade[];
      const nextDigitTrades = ((digitTradesResult.data ?? []) as unknown[]).map((trade) => ({
        id: String((trade as Record<string, unknown>).id),
        user_id: String((trade as Record<string, unknown>).user_id),
        account_id: typeof (trade as Record<string, unknown>).account_id === 'string'
          ? String((trade as Record<string, unknown>).account_id)
          : null,
        funding_source: String((trade as Record<string, unknown>).funding_source ?? 'demo') as 'demo' | 'app_wallet',
        symbol: String((trade as Record<string, unknown>).market_name ?? (trade as Record<string, unknown>).market_symbol ?? ''),
        contract_type: String((trade as Record<string, unknown>).contract_type ?? 'OVER'),
        stake: Number((trade as Record<string, unknown>).stake ?? 0),
        entry_quote: (trade as Record<string, unknown>).entry_price as number | string | null ?? null,
        price_precision: Number((trade as Record<string, unknown>).price_precision ?? 5),
        expected_payout: Number((trade as Record<string, unknown>).payout ?? 0),
        duration_seconds: Number((trade as Record<string, unknown>).duration_ticks ?? 1) * 3,
        expires_at: String((trade as Record<string, unknown>).expires_at ?? new Date().toISOString()),
        status: String((trade as Record<string, unknown>).status ?? 'open'),
        exit_quote: (trade as Record<string, unknown>).exit_price as number | string | null ?? null,
        payout: Number((trade as Record<string, unknown>).payout ?? 0),
        created_at: String((trade as Record<string, unknown>).created_at ?? new Date().toISOString()),
        settled_at: (trade as Record<string, unknown>).settled_at ? String((trade as Record<string, unknown>).settled_at) : null,
      })) as SitePaperTrade[];
      setUser(userData.user);
      setIsAdmin(Boolean(adminResult.data) && !adminResult.error);
      setProfile(profileResult.data as unknown as SiteProfile);
      setAccounts(nextAccounts);
      setPaperTrades(nextTrades);
      setDigitTrades(nextDigitTrades);
      setActiveAccountId(current => {
        const preferred = current ?? window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        const selected = nextAccounts.find(account => account.id === preferred && account.account_type !== 'real')
          ?? nextAccounts.find(account => account.account_type === 'demo')
          ?? null;
        if (selected) window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, selected.id);
        return selected?.id ?? null;
      });
      setAuthState('authenticated');
    } catch {
      setAuthState('error');
    }
  }, [supabaseConfig]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient(supabaseConfig);
    if (!supabase) {
      setAuthState('unconfigured');
      return;
    }

    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setAccounts([]);
        setIsAdmin(false);
        setPaperTrades([]);
        setDigitTrades([]);
        setActiveAccountId(null);
        setAuthState('unauthenticated');
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        window.setTimeout(() => void refresh(), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh, supabaseConfig]);

  const activeAccount = accounts.find(account => account.id === activeAccountId) ?? null;
  const openAuth = useCallback((mode: 'login' | 'signup') => {
    setAuthDialogMode(mode);
    setAuthDialogOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthDialogOpen(false), []);
  const switchAccount = useCallback((accountId: string) => {
    if (!accounts.some(account => account.id === accountId && account.account_type !== 'real')) return;
    setActiveAccountId(accountId);
    window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  }, [accounts]);
  const logout = useCallback(async () => {
    try {
      await signOutAccount();
    } finally {
      await getSupabaseBrowserClient(supabaseConfig)?.auth.signOut();
      setUser(null);
      setProfile(null);
      setAccounts([]);
      setIsAdmin(false);
      setPaperTrades([]);
      setDigitTrades([]);
      setActiveAccountId(null);
      setAuthState('unauthenticated');
    }
  }, [supabaseConfig]);

  const value = useMemo<SiteAuthContextValue>(() => ({
    authState,
    user,
    profile,
    accounts,
    isAdmin,
    paperTrades,
    digitTrades,
    activeAccount,
    isConfigured,
    authDialogOpen,
    authDialogMode,
    openAuth,
    closeAuth,
    logout,
    switchAccount,
    refresh,
  }), [
    authState,
    user,
    profile,
    accounts,
    isAdmin,
    paperTrades,
    digitTrades,
    activeAccount,
    isConfigured,
    authDialogOpen,
    authDialogMode,
    openAuth,
    closeAuth,
    logout,
    switchAccount,
    refresh,
  ]);

  return <SiteAuthContext.Provider value={value}>{children}</SiteAuthContext.Provider>;
}

export function useSiteAuth(): SiteAuthContextValue {
  const context = useContext(SiteAuthContext);
  if (!context) throw new Error('useSiteAuth must be used inside SiteAuthProvider');
  return context;
}