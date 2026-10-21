'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, CircleDollarSign, LoaderCircle, RefreshCw, Shield, X } from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';

type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  full_name: string;
  amount_usd: number | string;
  msisdn: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  payout_reference: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AdminPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutReferences, setPayoutReferences] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
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

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  const updateWithdrawal = async (withdrawal: WithdrawalRequest, action: 'approve' | 'reject' | 'paid') => {
    setBusyId(withdrawal.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNote: adminNotes[withdrawal.id] ?? '',
          payoutReference: payoutReferences[withdrawal.id] ?? '',
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
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
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600"><Shield className="h-4 w-4" /> Administration</p>
                  <h1 className="text-3xl font-semibold">Withdrawal requests</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Approve requests, send M-Pesa manually, then record the payout reference.</p>
                </div>
                <button type="button" onClick={() => void loadWithdrawals()} disabled={isLoading} className="flex h-10 items-center gap-2 border border-border px-3 text-sm font-medium hover:bg-muted/50 disabled:opacity-50">
                  {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </button>
              </div>

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
                                <input
                                  value={payoutReferences[withdrawal.id] ?? ''}
                                  onChange={event => setPayoutReferences(current => ({ ...current, [withdrawal.id]: event.target.value }))}
                                  placeholder="Manual M-Pesa payout reference"
                                  className="h-9 w-full border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <button type="button" disabled={busyId === withdrawal.id || !payoutReferences[withdrawal.id]?.trim()} onClick={() => void updateWithdrawal(withdrawal, 'paid')} className="flex h-8 items-center gap-1 bg-emerald-600 px-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                  {busyId === withdrawal.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CircleDollarSign className="h-3.5 w-3.5" />} Mark paid
                                </button>
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
        </div>
      </div>
    </main>
  );
}