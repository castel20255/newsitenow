'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  CircleCheck,
  Landmark,
  LoaderCircle,
  Smartphone,
} from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';

type WalletAction = 'deposit' | 'withdraw';
type PaymentMethod = 'bank-agent' | 'crypto' | 'mpesa';
type DepositStatus = 'initiating' | 'pending' | 'completed' | 'failed' | 'expired' | 'review';

interface WalletDeposit {
  id: string;
  amount_usd: number | string;
  amount_kes: number;
  status: DepositStatus;
  created_at: string;
  credited_usd?: number | string | null;
}

interface WalletActivity {
  id: string;
  account: 'app_wallet' | 'demo';
  description: string;
  transaction_type: string;
  amount: number | string;
  created_at: string;
  status?: string;
  deposit?: WalletDeposit;
}

const USD_TO_KES = 131.21;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const paymentMethods = [
  { id: 'bank-agent', label: 'Bank Agent', description: 'Not available through MegaPay', Icon: Landmark },
  { id: 'crypto', label: 'Crypto', description: 'Not available through MegaPay', Icon: Bitcoin },
  { id: 'mpesa', label: 'M-Pesa', description: 'STK push', Icon: Smartphone },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getKesAmount(amountUsd: string): number {
  const amount = Number(amountUsd);
  return Number.isFinite(amount) && amount > 0 ? Math.ceil(amount * USD_TO_KES - 0.0000001) : 0;
}

function isValidKenyanMobile(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^(?:254|0)?[17]\d{8}$/.test(digits);
}

export default function WalletPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const router = useRouter();
  const [action, setAction] = useState<WalletAction>('deposit');
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [amountUsd, setAmountUsd] = useState('2.00');
  const [msisdn, setMsisdn] = useState('');
  const [withdrawalName, setWithdrawalName] = useState('');
  const [withdrawalMsisdn, setWithdrawalMsisdn] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [deposit, setDeposit] = useState<WalletDeposit | null>(null);
  const [transactions, setTransactions] = useState<WalletActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const amountNumber = Number(amountUsd);
  const amountCents = amountNumber * 100;
  const isValidAmount = Number.isFinite(amountNumber) && amountNumber >= 2 && Math.abs(amountCents - Math.round(amountCents)) < 0.000001;
  const isValidPhone = isValidKenyanMobile(msisdn);
  const hasOpenDeposit = deposit?.status === 'pending' || deposit?.status === 'initiating';
  const activeWalletType = auth.activeAccount?.account_type === 'app_wallet' ? 'app_wallet' : 'demo';
  const activeWalletName = activeWalletType === 'app_wallet' ? 'App Wallet' : 'Demo account';
  const activeWalletBalance = activeWalletType === 'app_wallet'
    ? balanceUsd ?? Number(auth.activeAccount?.balance ?? 0)
    : Number(auth.activeAccount?.balance ?? 0);
  const activeTransactions = transactions.filter(transaction => transaction.account === activeWalletType);

  useEffect(() => {
    if (auth.authState !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;
    fetch('/api/wallet', { cache: 'no-store' })
      .then(async response => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || !isRecord(data)) throw new Error('Could not load wallet details.');
        if (cancelled) return;
        setBalanceUsd(Number(data.balanceUsd ?? 0));
        const recentDeposits = Array.isArray(data.deposits)
          ? data.deposits.filter(isRecord) as unknown as WalletDeposit[]
          : isRecord(data.latestDeposit)
            ? [data.latestDeposit as unknown as WalletDeposit]
            : [];
        setDeposit(recentDeposits[0] ?? null);
        setTransactions(Array.isArray(data.transactions) ? data.transactions.filter(isRecord) as unknown as WalletActivity[] : []);
      })
      .catch(error => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Could not load wallet details.');
          setMessageIsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.authState]);

  useEffect(() => {
    if (auth.profile?.phone_e164) {
      setMsisdn(current => current || auth.profile!.phone_e164);
      setWithdrawalMsisdn(current => current || auth.profile!.phone_e164);
    }
    if (auth.profile?.full_name) setWithdrawalName(current => current || auth.profile!.full_name);
  }, [auth.profile?.phone_e164, auth.profile?.full_name]);

  useEffect(() => {
    if (!deposit || !['pending', 'initiating'].includes(deposit.status)) return;

    const remainingMs = 60_000 - (Date.now() - new Date(deposit.created_at).getTime());
    const expireLocally = () => {
      const expired = { ...deposit, status: 'expired' as const };
      setDeposit(current => current?.id === deposit.id ? expired : current);
      setTransactions(current => current.map(item => item.id === deposit.id
        ? { ...item, status: 'expired', deposit: expired }
        : item));
    };

    if (remainingMs <= 0) {
      expireLocally();
      return;
    }

    const timeout = window.setTimeout(expireLocally, remainingMs);
    return () => window.clearTimeout(timeout);
  }, [deposit]);

  const startDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setMessageIsError(false);
    if (auth.authState !== 'authenticated') {
      auth.openAuth('login');
      return;
    }
    if (method !== 'mpesa') {
      setMessage('Choose M-Pesa to continue.');
      setMessageIsError(true);
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd, msisdn }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecord(data)) {
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Could not start the M-Pesa request.');
      }

      const nextDeposit: WalletDeposit = {
        id: String(data.depositId),
        amount_usd: Number(data.amountUsd),
        amount_kes: Number(data.amountKes),
        status: 'pending',
        created_at: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      };
      setDeposit(nextDeposit);
      setTransactions(current => [{
        id: nextDeposit.id,
        account: 'app_wallet',
        description: 'M-Pesa deposit',
        transaction_type: 'deposit',
        amount: nextDeposit.amount_usd,
        created_at: nextDeposit.created_at,
        status: nextDeposit.status,
        deposit: nextDeposit,
      }, ...current.filter(item => item.id !== nextDeposit.id)]);
      setMessage('STK push sent. Approve the KES payment on your phone, then check its status here.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start the M-Pesa request.');
      setMessageIsError(true);
    } finally {
      setIsStarting(false);
    }
  };

  const requestWithdrawal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setMessageIsError(false);
    setIsSubmittingWithdrawal(true);
    try {
      const response = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: withdrawalName, amountUsd: withdrawalAmount, msisdn: withdrawalMsisdn }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecord(data)) {
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Could not submit withdrawal request.');
      }
      setBalanceUsd(Number(data.balanceUsd));
      await auth.refresh();
      const withdrawalActivity: WalletActivity = {
        id: String(data.withdrawalId),
        account: 'app_wallet',
        description: 'M-Pesa withdrawal',
        transaction_type: 'withdrawal',
        amount: -Number(withdrawalAmount),
        created_at: new Date().toISOString(),
        status: 'pending',
      };
      setTransactions(current => [withdrawalActivity, ...current]);
      setWithdrawalAmount('');
      setMessage('Withdrawal request submitted. The amount is reserved while the admin reviews it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit withdrawal request.');
      setMessageIsError(true);
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const checkDeposit = useCallback(async (target: WalletDeposit) => {
    setIsChecking(true);
    setMessage('');
    setMessageIsError(false);
    try {
      const response = await fetch(`/api/wallet/deposits/${target.id}/verify`, { method: 'POST' });
      const data: unknown = await response.json().catch(() => null);
      if (!isRecord(data)) {
        throw new Error('Could not check payment status.');
      }
      if (data.status === 'review') {
        const reviewDeposit = { ...target, status: 'review' as const };
        setDeposit(current => current?.id === target.id ? reviewDeposit : current);
        setTransactions(current => current.map(item => item.id === target.id
          ? { ...item, status: 'review', deposit: reviewDeposit }
          : item));
        setMessage(typeof data.error === 'string' ? data.error : 'Payment needs support review before it can be credited.');
        setMessageIsError(true);
        return;
      }
      if (!response.ok) {
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Could not check payment status.');
      }

      let nextStatus = target.status;
      let nextCreditedUsd = target.credited_usd;
      if (data.status === 'completed') {
        nextStatus = 'completed';
        nextCreditedUsd = Number(data.creditedUsd ?? 0);
        if (typeof data.balanceUsd === 'number') setBalanceUsd(data.balanceUsd);
        await auth.refresh();
        auth.switchAccount('app-wallet');
        setMessage('Payment confirmed and App Wallet credited. Opening the trading workspace.');
        setIsRedirecting(true);
        window.setTimeout(() => router.push('/'), 1200);
      } else if (data.status === 'failed' || data.status === 'expired') {
        nextStatus = data.status;
        setMessage(data.status === 'expired' ? 'This payment request expired. Start a new deposit to try again.' : 'The payment was not completed. Start a new deposit to try again.');
        setMessageIsError(true);
      } else {
        if (data.status === 'pending') nextStatus = 'pending';
        setMessage('Payment is still pending. Approve the M-Pesa request, then check again.');
      }
      const updatedDeposit = { ...target, status: nextStatus, credited_usd: nextCreditedUsd };
      setDeposit(current => current?.id === target.id ? updatedDeposit : current);
      setTransactions(current => current.map(item => item.id === target.id
        ? {
            ...item,
            amount: nextStatus === 'completed' ? Number(nextCreditedUsd ?? target.amount_usd) : item.amount,
            status: nextStatus,
            deposit: updatedDeposit,
          }
        : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not check payment status.');
      setMessageIsError(true);
    } finally {
      setIsChecking(false);
    }
  }, [auth.refresh, auth.switchAccount, router]);

  useEffect(() => {
    if (
      !deposit ||
      deposit.status !== 'pending' ||
      isStarting ||
      isChecking ||
      Date.now() - new Date(deposit.created_at).getTime() >= 60_000
    ) return;

    const timeout = window.setTimeout(() => void checkDeposit(deposit), 3_000);
    return () => window.clearTimeout(timeout);
  }, [deposit, isStarting, isChecking, checkDeposit]);

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
      appWalletBalance={balanceUsd ?? undefined}
      showAccountBalance={false}
      actions={<ThemeToggle />}
    />
  );

  const isProcessingPayment = isStarting || isChecking || isRedirecting || (
    deposit?.status === 'pending' && Date.now() - new Date(deposit.created_at).getTime() < 60_000
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {header}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/60 px-4 backdrop-blur-[2px]">
          <div className="flex w-full max-w-sm items-center gap-4 border border-border bg-background p-5 shadow-xl" role="status" aria-live="polite">
            {isRedirecting ? (
              <CircleCheck className="h-7 w-7 shrink-0 text-emerald-600" />
            ) : (
              <LoaderCircle className="h-7 w-7 shrink-0 animate-spin text-primary" />
            )}
            <div>
              <p className="font-semibold">{isRedirecting ? 'Payment confirmed' : 'Processing payment'}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {isRedirecting
                  ? 'App Wallet has been updated. Opening the trading workspace.'
                  : isStarting
                    ? 'Sending the STK request. Approve it on your phone.'
                    : 'Waiting for MegaPay to confirm your payment.'}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-600">App wallet</p>
              <h1 className="text-3xl font-semibold tracking-normal">Wallet</h1>
            </div>
            <p className="border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Separate from your Deriv account
            </p>
          </div>

          <section className="mb-8 overflow-hidden border border-emerald-900 bg-emerald-950 text-white shadow-lg dark:border-emerald-800" aria-label="Active account balance">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Active account</p>
                <p className="mt-1 text-sm font-medium text-white/80">{activeWalletName}</p>
              </div>
              <span className="shrink-0 border border-white/20 px-2.5 py-1 text-xs font-medium text-emerald-100">
                {activeWalletType === 'app_wallet' ? 'App Wallet' : 'Demo'}
              </span>
            </div>
            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <p className="text-sm text-emerald-100/80">Available balance</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
                {auth.authState !== 'authenticated'
                  ? 'Sign in to view'
                  : activeWalletType === 'app_wallet' && isLoading
                    ? 'Loading…'
                    : money.format(activeWalletBalance)}
              </p>
            </div>
          </section>

          <section className="mb-10" aria-labelledby="wallet-activity-heading">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 id="wallet-activity-heading" className="text-lg font-semibold">{activeWalletName} transactions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Deposits, withdrawals, stakes, and payouts</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{activeTransactions.length} transactions</span>
            </div>
            <div className="max-h-[28rem] overflow-y-auto overscroll-contain border-y border-border" aria-label={`${activeWalletName} transaction history`}>
              {activeTransactions.length > 0 ? (
                <ul className="divide-y divide-border">
                  {activeTransactions.map(transaction => (
                    <li key={`${transaction.account}-${transaction.id}`} className="flex min-h-16 items-center justify-between gap-4 py-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{transaction.description}</span>
                        <span className="mt-1 block text-xs capitalize text-muted-foreground">
                          {transaction.status ? `${transaction.status} · ` : ''}{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(transaction.created_at))}
                        </span>
                      </span>
                      <span className={cn('shrink-0 font-semibold tabular-nums', Number(transaction.amount) < 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {money.format(Number(transaction.amount))}
                      </span>
                      {transaction.deposit && ['pending', 'expired', 'initiating', 'review'].includes(transaction.deposit.status) && (
                        <button
                          type="button"
                          onClick={() => void checkDeposit(transaction.deposit!)}
                          disabled={isChecking}
                          className="shrink-0 border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50 disabled:opacity-50"
                        >
                          {isChecking && deposit?.id === transaction.deposit.id ? 'Checking…' : 'Check status'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No transactions for this account yet.</p>
              )}
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <section aria-labelledby="wallet-action-heading">
              <div className="mb-6 flex border-b border-border" role="tablist" aria-label="Wallet action">
                <button
                  type="button"
                  role="tab"
                  aria-selected={action === 'deposit'}
                  onClick={() => {
                    setAction('deposit');
                    setMessage('');
                  }}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium',
                    action === 'deposit' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  )}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Deposit
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={action === 'withdraw'}
                  onClick={() => {
                    setAction('withdraw');
                    setMessage('');
                  }}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium',
                    action === 'withdraw' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  )}
                >
                  <ArrowUpFromLine className="h-4 w-4" />
                  Withdraw
                </button>
              </div>

              {action === 'deposit' ? (
                <>
                  <h2 id="wallet-action-heading" className="mb-4 text-lg font-semibold">Choose a deposit method</h2>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Deposit method">
                    {paymentMethods.map(({ id, label, description, Icon }) => {
                      const available = id === 'mpesa';
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={method === id}
                          disabled={!available}
                          onClick={() => setMethod(id)}
                          className={cn(
                            'flex min-h-28 flex-col items-start justify-between border p-4 text-left transition-colors',
                            method === id ? 'border-primary bg-primary/5' : 'border-border',
                            available ? 'hover:bg-muted/50' : 'cursor-not-allowed opacity-55'
                          )}
                        >
                          <Icon className="h-5 w-5 text-foreground" />
                          <span>
                            <span className="block text-sm font-semibold">{label}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <form className="mt-7 max-w-sm space-y-4" onSubmit={startDeposit}>
                    <div>
                      <label htmlFor="wallet-amount" className="mb-2 block text-sm font-medium">Deposit amount (USD)</label>
                      <input
                        id="wallet-amount"
                        type="number"
                        inputMode="decimal"
                        min="2.00"
                        step="0.01"
                        required
                        value={amountUsd}
                        onChange={event => setAmountUsd(event.target.value)}
                        className="h-11 w-full border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Minimum $2.00. M-Pesa will be charged approximately KES {getKesAmount(amountUsd).toLocaleString('en-KE')} (rounded up to the next shilling).</p>
                    </div>
                    <div>
                      <label htmlFor="wallet-msisdn" className="mb-2 block text-sm font-medium">Kenyan M-Pesa phone number</label>
                      <input
                        id="wallet-msisdn"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        value={msisdn}
                        onChange={event => setMsisdn(event.target.value)}
                        placeholder="0712 345 678"
                        className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isStarting || isLoading || !isValidPhone || !isValidAmount || hasOpenDeposit || auth.authState !== 'authenticated'}
                      className="flex h-11 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
                    >
                      {isStarting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      {isStarting ? 'Sending STK push…' : 'Pay with M-Pesa'}
                    </button>
                    {!isValidPhone && (
                      <p className="text-xs text-muted-foreground">Enter a valid Kenyan mobile number to enable M-Pesa payment.</p>
                    )}
                    {hasOpenDeposit && (
                      <p className="text-xs text-muted-foreground">A deposit is already in progress. Check its status before starting another payment.</p>
                    )}
                  </form>
                </>
              ) : (
                <>
                  <h2 id="wallet-action-heading" className="mb-4 text-lg font-semibold">Request an M-Pesa withdrawal</h2>
                  <p className="mb-5 max-w-lg text-sm leading-6 text-muted-foreground">
                    Requests are reviewed by an administrator and paid manually. The requested amount is reserved from your available App Wallet balance. You’ll see a payout reference when it is marked paid.
                  </p>
                  <form className="max-w-sm space-y-4" onSubmit={requestWithdrawal}>
                    <div>
                      <label htmlFor="withdrawal-full-name" className="mb-2 block text-sm font-medium">Full names</label>
                      <input
                        id="withdrawal-full-name"
                        type="text"
                        autoComplete="name"
                        minLength={2}
                        maxLength={120}
                        required
                        value={withdrawalName}
                        onChange={event => setWithdrawalName(event.target.value)}
                        className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label htmlFor="withdrawal-amount" className="mb-2 block text-sm font-medium">Amount (USD)</label>
                      <input
                        id="withdrawal-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        required
                        value={withdrawalAmount}
                        onChange={event => setWithdrawalAmount(event.target.value)}
                        className="h-11 w-full border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label htmlFor="withdrawal-msisdn" className="mb-2 block text-sm font-medium">M-Pesa phone number</label>
                      <input
                        id="withdrawal-msisdn"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        value={withdrawalMsisdn}
                        onChange={event => setWithdrawalMsisdn(event.target.value)}
                        placeholder="0712 345 678"
                        className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingWithdrawal || isLoading || auth.authState !== 'authenticated'}
                      className="flex h-11 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
                    >
                      {isSubmittingWithdrawal && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      {isSubmittingWithdrawal ? 'Submitting…' : 'Submit withdrawal'}
                    </button>
                  </form>
                </>
              )}

              {message && (
                <p className={cn('mt-4 max-w-xl text-sm leading-6', messageIsError ? 'text-destructive' : 'text-muted-foreground')} role="status" aria-live="polite">
                  {message}
                </p>
              )}
              {auth.authState !== 'authenticated' && action === 'deposit' && (
                <p className="mt-4 text-sm text-muted-foreground">Sign in to start a deposit and view your wallet balance.</p>
              )}
            </section>

            <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h2 className="text-base font-semibold">{action === 'deposit' ? 'Deposit details' : 'Withdrawal details'}</h2>
              {action === 'deposit' ? <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Exchange rate</dt>
                  <dd className="font-medium">$1 = KES {USD_TO_KES.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">KES request</dt>
                  <dd className="font-medium tabular-nums">{getKesAmount(amountUsd) ? `KES ${getKesAmount(amountUsd).toLocaleString('en-KE')}` : '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{deposit?.status ?? 'No deposit'}</dd>
                </div>
                {deposit?.status === 'completed' && (
                  <div className="flex justify-between gap-4 pb-3">
                    <dt className="text-muted-foreground">Credited</dt>
                    <dd className="font-medium tabular-nums">{money.format(Number(deposit.credited_usd ?? 0))}</dd>
                  </div>
                )}
              </dl> : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Withdrawals remain disabled until MegaPay documents a payout API and the app has a verified payout workflow.
                </p>
              )}

              {action === 'deposit' && (
                <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-muted-foreground">
                  Wallet credits are posted only after MegaPay’s transaction status confirms a completed payment for the requested KES amount.
                </p>
              )}
              {action === 'deposit' && deposit?.status === 'initiating' && (
                <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-muted-foreground">
                  The provider response is still being reconciled. Do not start another deposit; contact support before retrying to avoid a duplicate charge.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}