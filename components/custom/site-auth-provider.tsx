'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { signOutAccount } from '@/app/actions/account-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { SupabaseBrowserConfig } from '@/lib/supabase/types';

export type SiteAccountType = 'demo' | 'real';
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

export interface SitePaperTrade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  contract_type: 'CALL' | 'PUT' | 'CALLE' | 'PUTE';
  stake: number | string;
  entry_quote: number | string;
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
  paperTrades: SitePaperTrade[];
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
  const [paperTrades, setPaperTrades] = useState<SitePaperTrade[]>([]);
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
      setPaperTrades([]);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUser(null);
        setProfile(null);
        setAccounts([]);
        setPaperTrades([]);
        setActiveAccountId(null);
        setAuthState('unauthenticated');
        return;
      }

      const [profileResult, accountsResult, tradesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle(),
        supabase.from('trading_accounts').select('*').eq('user_id', userData.user.id),
        supabase.from('paper_trades').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(100),
      ]);
      if (profileResult.error || accountsResult.error || tradesResult.error || !profileResult.data) {
        setAuthState('error');
        return;
      }

      const nextAccounts = (accountsResult.data ?? []) as unknown as SiteTradingAccount[];
      const nextTrades = (tradesResult.data ?? []) as unknown as SitePaperTrade[];
      setUser(userData.user);
      setProfile(profileResult.data as unknown as SiteProfile);
      setAccounts(nextAccounts);
      setPaperTrades(nextTrades);
      setActiveAccountId(current => {
        const preferred = current ?? window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        const selected = nextAccounts.find(account => account.id === preferred)
          ?? nextAccounts.find(account => account.account_type === 'demo')
          ?? nextAccounts[0]
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
        setPaperTrades([]);
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
    setActiveAccountId(accountId);
    window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  }, []);
  const logout = useCallback(async () => {
    try {
      await signOutAccount();
    } finally {
      await getSupabaseBrowserClient(supabaseConfig)?.auth.signOut();
      setUser(null);
      setProfile(null);
      setAccounts([]);
      setPaperTrades([]);
      setActiveAccountId(null);
      setAuthState('unauthenticated');
    }
  }, [supabaseConfig]);

  const value = useMemo<SiteAuthContextValue>(() => ({
    authState,
    user,
    profile,
    accounts,
    paperTrades,
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
    paperTrades,
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