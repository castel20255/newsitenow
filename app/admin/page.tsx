'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CircleDollarSign, LoaderCircle, LogOut, RefreshCw, Shield, Users, WalletCards, X } from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';

type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';
type PayoutStatus = 'not_started' | 'initiating' | 'queued' | 'failed' | 'success';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  full_name: string;
  amount_usd: number | string;
  msisdn: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  payout_reference: string | null;
  payout_provider: string | null;
  payout_provider_request_id: string | null;
  payout_amount_kes: number | null;
  payout_status: PayoutStatus;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
}

interface FundUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
  minimumDepositUsd: number;
  lastSeenAt: string | null;
  demoBalance: number;
  siteWalletBalance: number;
  realBalance: number;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AdminPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const router = useRouter();
  const [section, setSection] = useState<'funds' | 'withdrawals'>('funds');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<FundUser[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [editingDepositUserId, setEditingDepositUserId] = useState<string | null>(null);
  const [minimumDepositDraft, setMinimumDepositDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadWithdrawals = useCallback(async () => {
    if (!auth.isAdmin) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/withdrawals', { cache: 'no-store' });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof data !== 'object' || data === null || !('withdrawals' in data) || !Array.isArray(data.withdrawals)) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Could not load withdrawal requests.';
        throw new Error(message);
      }
      setWithdrawals(data.withdrawals as WithdrawalRequest[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load withdrawal requests.');
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAdmin]);

  const loadFunds = useCallback(async () => {
    if (!auth.isAdmin) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/funds', { cache: 'no-store' });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof data !== 'object' || data === null || !('users' in data) || !Array.isArray(data.users)) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Could not load funds management data.';
        throw new Error(message);
      }
      setUsers(data.users as FundUser[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load funds management data.');
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAdmin]);

  useEffect(() => {
    if (section === 'funds') {
      void loadFunds();
    } else {
      void loadWithdrawals();
    }
  }, [section, loadFunds, loadWithdrawals]);

  const saveBalance = async (user: FundUser) => {
    setBusyId(user.id);
    setError('');
    try {
      const response = await fetch('/api/admin/funds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, balance: balanceDraft, note: balanceNote }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof data !== 'object' || data === null || !('newBalance' in data)) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Could not update Real Wallet balance.';
        throw new Error(message);
      }
      setUsers(current => current.map(item => item.id === user.id
        ? { ...item, siteWalletBalance: Number(data.newBalance) }
        : item));
      setEditingUserId(null);
      setBalanceDraft('');
      setBalanceNote('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update Real Wallet balance.');
    } finally {
      setBusyId(null);
    }
  };

  const saveMinimumDeposit = async (user: FundUser) => {
    setBusyId(user.id);
    setError('');
    try {
      const response = await fetch('/api/admin/funds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, minimumDepositUsd: minimumDepositDraft }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof data !== 'object' || data === null || !('minimumDepositUsd' in data)) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Could not update the minimum deposit.';
        throw new Error(message);
      }
      setUsers(current => current.map(item => item.id === user.id
        ? { ...item, minimumDepositUsd: Number(data.minimumDepositUsd) }
        : item));
      setEditingDepositUserId(null);
      setMinimumDepositDraft('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the minimum deposit.');
    } finally {
      setBusyId(null);
    }
  };

  const logOutAdmin = async () => {
    try {
      await auth.logout();
    } catch {
      return;
    } finally {
      router.replace('/');
    }
  };

  const updateWithdrawal = async (withdrawal: WithdrawalRequest, action: 'approve' | 'reject' | 'check') => {
    setBusyId(withdrawal.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNote: adminNotes[withdrawal.id] ?? '',
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'Could not update withdrawal request.';
        throw new Error(message);
      }
      await loadWithdrawals();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update withdrawal request.');
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <Header
      authState={auth.authState}
      accounts={auth.accounts}
      activeAccount={auth.activeAccount}
      onLogin={async () => auth.openAuth('login')}
      onSignUp={async () => auth.openAuth('signup')}
      onLogout={() => { void auth.logout(); }}
      onSwitchAccount={async accountId => auth.switchAccount(accountId)}
      logoSrc={logoSrc}
      actions={<ThemeToggle />}
    />
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0">
        <div className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:py-8">
          {auth.authState !== 'authenticated' ? (
            <div className="mx-auto max-w-md border-y border-border py-12 text-center">
              <Shield className="mx-auto mb-4 h-7 w-7 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Admin sign in required</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in with an authorized administrator account to view withdrawal requests.</p>
              <button type="button" onClick={() => auth.openAuth('login')} className="mt-5 h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground">Sign in</button>
            </div>
          ) : !auth.isAdmin ? (
            <div className="mx-auto max-w-md border-y border-border py-12 text-center">
              <Shield className="mx-auto mb-4 h-7 w-7 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Admin access required</h1>
              <p className="mt-2 text-sm text-muted-foreground">This Supabase account is not authorized to view withdrawal requests.</p>
            </div>
          ) : (
            <>
              <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-6 lg:flex-row">
                <aside className="flex shrink-0 flex-col border-b border-border pb-4 lg:w-60 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                  <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold"><Shield className="h-4 w-4 text-emerald-600" /> Administration</div>
                  <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Admin navigation">
                    <button type="button" onClick={() => setSection('funds')} className={cn('flex shrink-0 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium', section === 'funds' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                      <Users className="h-4 w-4" /> Funds Management
                    </button>
                    <button type="button" onClick={() => setSection('withdrawals')} className={cn('flex shrink-0 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium', section === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                      <WalletCards className="h-4 w-4" /> Withdrawals
                    </button>
                  </nav>
                  <button type="button" onClick={() => void logOutAdmin()} className="mt-auto flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </aside>

                <section className="min-w-0 flex-1">
                  <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600"><Shield className="h-4 w-4" /> Administration</p>
                      <h1 className="text-3xl font-semibold">{section === 'funds' ? 'Funds Management' : 'Withdrawal requests'}</h1>
                      {section === 'funds' && <p className="mt-2 text-sm text-muted-foreground">{isLoading && users.length === 0 ? 'Loading users from the database…' : error && users.length === 0 ? 'Could not load users' : `${users.length} users loaded`}</p>}
                      {section === 'withdrawals' && <p className="mt-2 text-sm text-muted-foreground">Approve requests to send M-Pesa through PayHero, then check the payout status.</p>}
                    </div>
                    <button type="button" onClick={() => void (section === 'funds' ? loadFunds() : loadWithdrawals())} disabled={isLoading} className="flex h-10 items-center gap-2 border border-border px-3 text-sm font-medium hover:bg-muted/50 disabled:opacity-50">
                      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Refresh
                    </button>
                  </div>

              {section === 'funds' ? (
                <>
                {error && <p className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">{error}</p>}
                <div className="overflow-x-auto border-y border-border">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="px-3 py-3 font-medium">User</th>
                        <th className="px-3 py-3 font-medium">Status / last seen</th>
                        <th className="px-3 py-3 text-right font-medium">Demo</th>
                        <th className="px-3 py-3 text-right font-medium">Real Wallet</th>
                        <th className="px-3 py-3 text-right font-medium">Min. deposit</th>
                        <th className="px-3 py-3 text-right font-medium">Real</th>
                        <th className="px-3 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => {
                        const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt) : null;
                        const active = lastSeen !== null && Date.now() - lastSeen.getTime() < 5 * 60_000;
                        return (
                          <tr key={user.id} className="border-t border-border align-top">
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{user.fullName || user.username || 'Unnamed user'}</span>
                                <span className={cn(
                                  'inline-flex border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                                  user.isAdmin ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-700' : 'border-border text-muted-foreground'
                                )}>{user.isAdmin ? 'Admin' : 'User'}</span>
                              </div>
                              <span className="mt-1 block text-xs text-muted-foreground">{user.email}</span>
                              {user.username && <span className="mt-1 block text-xs text-muted-foreground">@{user.username}</span>}
                            </td>
                            <td className="px-3 py-4">
                              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', active ? 'text-emerald-700' : 'text-muted-foreground')}>
                                <span className={cn('h-2 w-2 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                                {active ? 'Active' : lastSeen ? 'Last seen' : 'Never seen'}
                              </span>
                              {lastSeen && <span className="mt-1 block text-xs text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(lastSeen)}</span>}
                            </td>
                            <td className="px-3 py-4 text-right font-medium tabular-nums">{money.format(user.demoBalance)}</td>
                            <td className="px-3 py-4 text-right font-semibold tabular-nums">{money.format(user.siteWalletBalance)}</td>
                            <td className="px-3 py-4 text-right font-medium tabular-nums">{money.format(user.minimumDepositUsd)}</td>
                            <td className="px-3 py-4 text-right font-medium tabular-nums">{money.format(user.realBalance)}</td>
                            <td className="px-3 py-4">
                              <div className="ml-auto flex w-64 flex-col items-stretch gap-2 text-left">
                              {editingDepositUserId === user.id ? (
                                <div className="space-y-2 border-b border-border pb-3">
                                  <label className="block text-xs font-medium" htmlFor={`minimum-deposit-${user.id}`}>Minimum deposit (USD)</label>
                                  <input
                                    id={`minimum-deposit-${user.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    value={minimumDepositDraft}
                                    onChange={event => setMinimumDepositDraft(event.target.value)}
                                    className="h-9 w-full border border-input bg-background px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => { setEditingDepositUserId(null); setMinimumDepositDraft(''); }} className="h-8 border border-border px-2.5 text-xs font-medium hover:bg-muted">Cancel</button>
                                    <button type="button" disabled={busyId === user.id || !/^\d+(?:\.\d{1,2})?$/.test(minimumDepositDraft) || Number(minimumDepositDraft) < 1 || Number(minimumDepositDraft) > 1000000} onClick={() => void saveMinimumDeposit(user)} className="flex h-8 items-center gap-1 bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                      {busyId === user.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save minimum
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button type="button" onClick={() => { setEditingDepositUserId(user.id); setMinimumDepositDraft(user.minimumDepositUsd.toFixed(2)); }} className="h-8 border border-border px-3 text-xs font-semibold hover:bg-muted">Minimum deposit</button>
                              )}
                              {editingUserId === user.id ? (
                                <div className="ml-auto w-64 space-y-2 text-left">
                                  <label className="block text-xs font-medium" htmlFor={`site-balance-${user.id}`}>New Real Wallet balance (USD)</label>
                                  <input
                                    id={`site-balance-${user.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    max="1000000000000"
                                    step="0.01"
                                    value={balanceDraft}
                                    onChange={event => setBalanceDraft(event.target.value)}
                                    className="h-9 w-full border border-input bg-background px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                  <input
                                    aria-label="Adjustment note"
                                    maxLength={500}
                                    value={balanceNote}
                                    onChange={event => setBalanceNote(event.target.value)}
                                    placeholder="Reason (optional)"
                                    className="h-9 w-full border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => { setEditingUserId(null); setBalanceDraft(''); setBalanceNote(''); }} className="h-8 border border-border px-2.5 text-xs font-medium hover:bg-muted">Cancel</button>
                                    <button type="button" disabled={busyId === user.id || !/^\d+(?:\.\d{1,2})?$/.test(balanceDraft)} onClick={() => void saveBalance(user)} className="flex h-8 items-center gap-1 bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                      {busyId === user.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button type="button" onClick={() => { setEditingUserId(user.id); setBalanceDraft(user.siteWalletBalance.toFixed(2)); }} className="h-8 border border-border px-3 text-xs font-semibold hover:bg-muted">Manage</button>
                              )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {isLoading && users.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Loading users…</p>}
                  {!isLoading && !error && users.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>}
                </div>
                </>
              ) : (
                <>
              <div className="mb-5 flex flex-wrap gap-5 text-sm">
                {(['pending', 'approved', 'paid', 'rejected'] as const).map(status => (
                  <p key={status} className="capitalize text-muted-foreground">
                    {status} <span className="ml-1 font-semibold tabular-nums text-foreground">{withdrawals.filter(item => item.status === status).length}</span>
                  </p>
                ))}
              </div>

              {error && <p className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">{error}</p>}

              {isLoading && withdrawals.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading requests…</p>
              ) : withdrawals.length === 0 ? (
                <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">No withdrawal requests yet.</p>
              ) : (
                <div className="overflow-x-auto border-y border-border">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="px-3 py-3 font-medium">User / name</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium">M-Pesa</th>
                        <th className="px-3 py-3 font-medium">Requested</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map(withdrawal => (
                        <tr key={withdrawal.id} className="border-t border-border align-top">
                          <td className="px-3 py-4">
                            <span className="block font-medium">{withdrawal.full_name}</span>
                            <span className="mt-1 block max-w-48 truncate text-xs text-muted-foreground" title={withdrawal.user_id}>{withdrawal.user_id}</span>
                          </td>
                          <td className="px-3 py-4 font-semibold tabular-nums">{money.format(Number(withdrawal.amount_usd))}</td>
                          <td className="px-3 py-4 tabular-nums">{withdrawal.msisdn}</td>
                          <td className="px-3 py-4 text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(withdrawal.created_at))}</td>
                          <td className="px-3 py-4">
                            <span className={cn(
                              'inline-flex border px-2 py-1 text-xs font-medium capitalize',
                              withdrawal.status === 'paid' ? 'border-emerald-600/30 text-emerald-700' :
                                withdrawal.status === 'rejected' ? 'border-destructive/30 text-destructive' :
                                  withdrawal.status === 'approved' ? 'border-blue-500/30 text-blue-700' : 'border-amber-500/30 text-amber-700'
                            )}>{withdrawal.status}</span>
                            {withdrawal.payout_reference && <span className="mt-2 block text-xs text-muted-foreground">Ref: {withdrawal.payout_reference}</span>}
                            {withdrawal.payout_status !== 'not_started' && <span className="mt-2 block text-xs capitalize text-muted-foreground">PayHero: {withdrawal.payout_status}</span>}
                          </td>
                          <td className="w-72 px-3 py-4">
                            {withdrawal.status === 'pending' && (
                              <div className="space-y-2">
                                <textarea
                                  value={adminNotes[withdrawal.id] ?? ''}
                                  onChange={event => setAdminNotes(current => ({ ...current, [withdrawal.id]: event.target.value }))}
                                  placeholder="Optional note"
                                  rows={2}
                                  className="w-full resize-y border border-input bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <div className="flex gap-2">
                                  <button type="button" disabled={busyId === withdrawal.id} onClick={() => void updateWithdrawal(withdrawal, 'approve')} className="flex h-8 items-center gap-1 bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                    {busyId === withdrawal.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                                  </button>
                                  <button type="button" disabled={busyId === withdrawal.id} onClick={() => void updateWithdrawal(withdrawal, 'reject')} className="flex h-8 items-center gap-1 border border-border px-2.5 text-xs font-medium hover:bg-muted/50 disabled:opacity-50">
                                    <X className="h-3.5 w-3.5" /> Reject / refund
                                  </button>
                                </div>
                              </div>
                            )}
                            {withdrawal.status === 'approved' && (
                              <div className="space-y-2">
                                {withdrawal.payout_status === 'not_started' && (
                                  <button type="button" disabled={busyId === withdrawal.id} onClick={() => void updateWithdrawal(withdrawal, 'approve')} className="flex h-8 items-center gap-1 bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                    {busyId === withdrawal.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CircleDollarSign className="h-3.5 w-3.5" />} Send PayHero payout
                                  </button>
                                )}
                                {['initiating', 'queued'].includes(withdrawal.payout_status) && (
                                  <button type="button" disabled={busyId === withdrawal.id} onClick={() => void updateWithdrawal(withdrawal, 'check')} className="flex h-8 items-center gap-1 border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50">
                                    {busyId === withdrawal.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Check PayHero status
                                  </button>
                                )}
                                {withdrawal.payout_status === 'failed' && (
                                  <>
                                    <p className="text-xs text-destructive">PayHero failed. Refund the reserved wallet balance by rejecting this request.</p>
                                    <button type="button" disabled={busyId === withdrawal.id} onClick={() => void updateWithdrawal(withdrawal, 'reject')} className="flex h-8 items-center gap-1 border border-border px-2.5 text-xs font-medium hover:bg-muted/50 disabled:opacity-50">
                                      <X className="h-3.5 w-3.5" /> Reject / refund
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            {withdrawal.admin_note && <p className="mt-2 text-xs text-muted-foreground">{withdrawal.admin_note}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </>
              )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}