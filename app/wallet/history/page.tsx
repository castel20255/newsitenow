'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, RefreshCw } from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';

type HistoryFilter = 'all' | 'transactions' | 'deposits' | 'withdrawals' | 'trades';
type HistoryCategory = Exclude<HistoryFilter, 'all'>;

interface WalletTransaction {
  id: string;
  account: 'app_wallet' | 'demo';
  description: string;
  transaction_type: string;
  amount: number | string;
  created_at: string;
  status?: string;
}

interface WalletDeposit {
  id: string;
  amount_usd: number | string;
  amount_kes: number;
  credited_usd?: number | string | null;
  status: string;
  created_at: string;
}

interface WalletWithdrawal {
  id: string;
  amount_usd: number | string;
  status: string;
  created_at: string;
  payout_reference?: string | null;
  admin_note?: string | null;
}

interface WalletTrade {
  id: string;
  source: 'contract' | 'digit';
  funding_source?: 'demo' | 'app_wallet';
  symbol?: string;
  market_symbol?: string;
  market_name?: string;
  contract_type: string;
  prediction_digit?: number | null;
  outcome_digit?: number;
  stake: number | string;
  payout: number | string;
  profit?: number | string;
  status: string;
  created_at: string;
}

interface HistoryData {
  transactions: WalletTransaction[];
  deposits: WalletDeposit[];
  withdrawals: WalletWithdrawal[];
  trades: WalletTrade[];
}

interface HistoryEntry {
  id: string;
  category: HistoryCategory;
  title: string;
  detail: string;
  date: string;
  status?: string;
  amount: number | null;
  amountLabel: string;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const filters: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'trades', label: 'Trades' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function getStatusPresentation(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'pending' || normalized === 'initiating') {
    return { label: 'Pending', className: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300' };
  }
  if (normalized === 'rejected' || normalized === 'failed' || normalized === 'expired') {
    return { label: normalized[0].toUpperCase() + normalized.slice(1), className: 'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300' };
  }
  if (normalized === 'completed' || normalized === 'paid') {
    return { label: 'Completed', className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };
  }
  if (normalized === 'approved') {
    return { label: 'Approved', className: 'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300' };
  }
  return { label: normalized[0]?.toUpperCase() + normalized.slice(1), className: 'border-border bg-muted/50 text-muted-foreground' };
}

function getContractName(contractType: string) {
  const names: Record<string, string> = {
    CALL: 'Rise',
    PUT: 'Fall',
    CALLE: 'Rise (Equal)',
    PUTE: 'Fall (Equal)',
    OVER: 'Over',
    UNDER: 'Under',
    EVEN: 'Even',
    ODD: 'Odd',
    MATCH: 'Matches',
    DIFFER: 'Differs',
  };
  return names[contractType] ?? contractType;
}

export default function WalletHistoryPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const [history, setHistory] = useState<HistoryData>({ transactions: [], deposits: [], withdrawals: [], trades: [] });
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    if (auth.authState !== 'authenticated') return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/wallet?includeTrades=true', { cache: 'no-store' });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecord(data)) {
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Could not load transaction history.');
      }
      setHistory({
        transactions: Array.isArray(data.transactions) ? data.transactions.filter(isRecord) as unknown as WalletTransaction[] : [],
        deposits: Array.isArray(data.deposits) ? data.deposits.filter(isRecord) as unknown as WalletDeposit[] : [],
        withdrawals: Array.isArray(data.withdrawals) ? data.withdrawals.filter(isRecord) as unknown as WalletWithdrawal[] : [],
        trades: Array.isArray(data.trades) ? data.trades.filter(isRecord) as unknown as WalletTrade[] : [],
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load transaction history.');
    } finally {
      setIsLoading(false);
    }
  }, [auth.authState]);

  useEffect(() => {
    if (auth.authState === 'authenticated') void loadHistory();
    else if (auth.authState !== 'loading') setIsLoading(false);
  }, [auth.authState, loadHistory]);

  const entries: HistoryEntry[] = [
    ...history.transactions
      .filter(transaction => !['deposit', 'withdrawal', 'withdrawal_reversed'].includes(transaction.transaction_type))
      .map(transaction => ({
        id: `transaction-${transaction.account}-${transaction.id}`,
        category: transaction.transaction_type === 'admin_deposit'
          ? 'deposits' as const
          : transaction.transaction_type === 'admin_withdrawal'
            ? 'withdrawals' as const
            : 'transactions' as const,
        title: transaction.description,
        detail: transaction.account === 'app_wallet' ? 'Real Wallet ledger' : 'Demo account ledger',
        date: transaction.created_at,
        status: transaction.status,
        amount: Number(transaction.amount),
        amountLabel: money.format(Number(transaction.amount)),
      })),
    ...history.deposits.map(deposit => ({
      id: `deposit-${deposit.id}`,
      category: 'deposits' as const,
      title: 'M-Pesa deposit',
      detail: `KES ${Number(deposit.amount_kes).toLocaleString('en-KE')} · Real Wallet`,
      date: deposit.created_at,
      status: deposit.status,
      amount: Number(deposit.credited_usd ?? deposit.amount_usd),
      amountLabel: money.format(Number(deposit.credited_usd ?? deposit.amount_usd)),
    })),
    ...history.withdrawals.map(withdrawal => {
      const rejectedForTradeVolume = withdrawal.status === 'rejected' && withdrawal.admin_note?.includes('Real Wallet trade volume is $');
      const amount = rejectedForTradeVolume
        ? 0
        : withdrawal.status === 'rejected' ? Number(withdrawal.amount_usd) : -Number(withdrawal.amount_usd);
      const detail = withdrawal.status === 'rejected'
        ? `Reason: ${withdrawal.admin_note || 'No rejection reason was recorded.'}${rejectedForTradeVolume ? ' No funds were deducted.' : ''}`
        : withdrawal.payout_reference
          ? `Real Wallet · Ref ${withdrawal.payout_reference}`
          : 'Real Wallet';
      return {
        id: `withdrawal-${withdrawal.id}`,
        category: 'withdrawals' as const,
        title: rejectedForTradeVolume ? 'Rejected withdrawal request' : withdrawal.status === 'rejected' ? 'Rejected withdrawal refund' : 'M-Pesa withdrawal',
        detail,
        date: withdrawal.created_at,
        status: withdrawal.status,
        amount,
        amountLabel: rejectedForTradeVolume ? 'Not deducted' : money.format(amount),
      };
    }),
    ...history.trades.map(trade => {
      const stake = Number(trade.stake);
      const payout = Number(trade.payout);
      const profit = trade.source === 'digit' ? Number(trade.profit ?? payout - stake) : payout - stake;
      const market = trade.market_name || trade.symbol || trade.market_symbol || 'Market';
      const account = trade.funding_source === 'app_wallet' ? 'Real Wallet' : 'Demo account';
      const digitDetail = trade.source === 'digit'
        ? ` · Pick ${trade.prediction_digit ?? '—'} · Exit ${trade.outcome_digit ?? '—'}`
        : '';
      return {
        id: `trade-${trade.source}-${trade.id}`,
        category: 'trades' as const,
        title: `${getContractName(trade.contract_type)} · ${market}`,
        detail: `${account} · Stake ${money.format(stake)}${digitDetail}`,
        date: trade.created_at,
        status: trade.status,
        amount: trade.status === 'open' ? null : profit,
        amountLabel: trade.status === 'open' ? `Stake ${money.format(stake)}` : `P&L ${money.format(profit)}`,
      };
    }),
  ].sort((left, right) => new Date(right.date).valueOf() - new Date(left.date).valueOf());

  const visibleEntries = entries.filter(entry => filter === 'all' || entry.category === filter);
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
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <Link href="/wallet" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Wallet
              </Link>
              <h1 className="text-2xl font-semibold">Transaction history</h1>
              <p className="mt-1 text-sm text-muted-foreground">Deposits, withdrawals, wallet transactions, and trades</p>
            </div>
            {auth.authState === 'authenticated' && (
              <button type="button" onClick={() => void loadHistory()} disabled={isLoading} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-medium hover:bg-muted/50 disabled:opacity-50">
                {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
            )}
          </div>

          {auth.authState !== 'authenticated' ? (
            <div className="border-y border-border py-10 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {auth.authState === 'unconfigured' ? 'Transaction history is unavailable until the account service is configured.' : 'Sign in to view your transaction history.'}
              </p>
              {auth.authState === 'unauthenticated' && <button type="button" onClick={() => auth.openAuth('login')} className="h-10 bg-primary px-4 text-sm font-semibold text-primary-foreground">Sign in</button>}
            </div>
          ) : (
            <>
              {error && <p className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">{error}</p>}
              <nav className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3" aria-label="History filters">
                {filters.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'h-9 border px-3 text-sm font-medium transition-colors',
                      filter === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                <span className="ml-auto self-center text-xs text-muted-foreground">{visibleEntries.length} records</span>
              </nav>

              {isLoading && entries.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading history…</p>
              ) : visibleEntries.length === 0 ? (
                <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">No {filter === 'all' ? 'history' : filter} records yet.</p>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {visibleEntries.map(entry => (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{entry.title}</p>
                          <span className="border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{entry.category}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <time className="text-xs text-muted-foreground" dateTime={entry.date}>{formatDate(entry.date)}</time>
                          {entry.status && (() => {
                            const status = getStatusPresentation(entry.status);
                            return (
                              <span className={cn('inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', status.className)}>
                                {status.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <p className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        entry.amount === null ? 'text-muted-foreground' : entry.amount < 0 ? 'text-destructive' : entry.amount > 0 ? 'text-emerald-600' : 'text-foreground'
                      )}>{entry.amountLabel}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}