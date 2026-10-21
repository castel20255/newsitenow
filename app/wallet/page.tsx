'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  CircleCheck,
  History,
  Landmark,
  LoaderCircle,
  Smartphone,
  X,
} from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type WalletAction = 'deposit' | 'withdraw' | null;
type PaymentMethod = 'bank-agent' | 'crypto' | 'mpesa';
type DepositStatus = 'initiating' | 'pending' | 'completed' | 'failed' | 'expired' | 'review';
type WithdrawalConfirmation = {
  status: 'processing' | 'pending';
  amountUsd: number;
  fullName: string;
  msisdn: string;
};

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
const WITHDRAWAL_USD_TO_KES = 127;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const kesMoney = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 });

const paymentMethods = [
  { id: 'bank-agent', label: 'Bank Agent', description: 'Coming soon', Icon: Landmark },
  { id: 'crypto', label: 'Crypto', description: 'Coming soon', Icon: Bitcoin },
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
  const [action, setAction] = useState<WalletAction>(null);
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [amountUsd, setAmountUsd] = useState('1.00');
  const [msisdn, setMsisdn] = useState('');
  const [withdrawalName, setWithdrawalName] = useState('');
  const [withdrawalMsisdn, setWithdrawalMsisdn] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [minimumDepositUsd, setMinimumDepositUsd] = useState(1);
  const [deposit, setDeposit] = useState<WalletDeposit | null>(null);
  const [transactions, setTransactions] = useState<WalletActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [demoWarningVisible, setDemoWarningVisible] = useState(false);
  const [withdrawalConfirmation, setWithdrawalConfirmation] = useState<WithdrawalConfirmation | null>(null);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const amountNumber = Number(amountUsd);
  const amountCents = amountNumber * 100;
  const isValidAmount = Number.isFinite(amountNumber) && amountNumber >= minimumDepositUsd && Math.abs(amountCents - Math.round(amountCents)) < 0.000001;
  const isValidPhone = isValidKenyanMobile(msisdn);
  const withdrawalAmountNumber = Number(withdrawalAmount);
  const expectedWithdrawalKes = Number.isFinite(withdrawalAmountNumber) && withdrawalAmountNumber > 0
    ? withdrawalAmountNumber * WITHDRAWAL_USD_TO_KES
    : null;
  const hasOpenDeposit = deposit?.status === 'pending' || deposit?.status === 'initiating';
  const activeWalletType = auth.activeAccount?.account_type === 'app_wallet' ? 'app_wallet' : 'demo';
  const activeWalletBalance = activeWalletType === 'app_wallet'
    ? balanceUsd ?? Number(auth.activeAccount?.balance ?? 0)
    : Number(auth.activeAccount?.balance ?? 0);
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
        const savedMinimum = Number(data.minimumDepositUsd ?? 1);
        setMinimumDepositUsd(savedMinimum);
        setAmountUsd(current => Number(current) < savedMinimum ? savedMinimum.toFixed(2) : current);
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
      setMessage('Payment request sent. Approve it on your phone, then check its status here.');
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
    const submittedFullName = auth.profile?.full_name?.trim() || withdrawalName.trim();
    setIsSubmittingWithdrawal(true);
    try {
      const response = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: submittedFullName, amountUsd: withdrawalAmount, msisdn: withdrawalMsisdn }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecord(data)) {
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Could not submit withdrawal request.');
      }
      setBalanceUsd(Number(data.balanceUsd));
      void auth.refresh().catch(() => {});
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
      setAction(null);
      setWithdrawalConfirmation({
        status: 'processing',
        amountUsd: Number(withdrawalAmount),
        fullName: submittedFullName,
        msisdn: withdrawalMsisdn,
      });
      setWithdrawalAmount('');
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
        setMessage('Payment confirmed and Real Wallet credited. Opening the trading workspace.');
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

  useEffect(() => {
    if (!demoWarningVisible) return;

    const timer = window.setTimeout(() => setDemoWarningVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [demoWarningVisible]);

  useEffect(() => {
    if (withdrawalConfirmation?.status !== 'processing') return;

    const timer = window.setTimeout(() => {
      setWithdrawalConfirmation(current => current?.status === 'processing'
        ? { ...current, status: 'pending' }
        : current);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [withdrawalConfirmation?.status]);

  const handleWalletActionClick = (type: 'deposit' | 'withdraw') => {
    if (auth.activeAccount?.account_type !== 'app_wallet') {
      setDemoWarningVisible(true);
      setAction(null);
      setMessage('');
      setMessageIsError(false);
      return;
    }

    setAction(type);
    setMessage('');
  };

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {header}
      {demoWarningVisible && (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-[140] flex justify-center px-4">
          <div className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/95 px-4 py-3 text-white shadow-[0_18px_48px_rgba(127,29,29,0.45)] transition-opacity duration-500 ease-out">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-400/50 bg-red-500/10 text-3xl font-black text-red-300">!</div>
            <p className="text-sm font-medium leading-6 text-red-50">
              You&apos;re using a Demo account. Withdrawals and deposits are disabled. Switch to Real Wallet and try again.
            </p>
          </div>
        </div>
      )}
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
                  ? 'Your Real Wallet has been updated. Opening the trading workspace.'
                  : isStarting
                    ? 'Sending your payment request. Approve it on your phone.'
                    : 'Waiting for payment confirmation.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {withdrawalConfirmation && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-background/65 px-4 backdrop-blur-sm" role="presentation">
          <section className="relative w-full max-w-md border border-border bg-background p-6 text-center shadow-2xl sm:p-8" role="status" aria-live="polite">
            {withdrawalConfirmation.status === 'pending' && (
              <button
                type="button"
                aria-label="Close withdrawal confirmation"
                onClick={() => setWithdrawalConfirmation(null)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {withdrawalConfirmation.status === 'processing' ? (
              <>
                <h2 className="text-2xl font-semibold">Processing withdrawal</h2>
                <LoaderCircle className="mx-auto my-6 h-16 w-16 animate-spin text-primary" aria-hidden="true" />
                <dl className="space-y-3 border-t border-border pt-4 text-left text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-semibold tabular-nums">{money.format(withdrawalConfirmation.amountUsd)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Account name</dt>
                    <dd className="text-right font-medium">{withdrawalConfirmation.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">M-Pesa number</dt>
                    <dd className="font-medium tabular-nums">{withdrawalConfirmation.msisdn}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <CircleCheck className="mx-auto h-20 w-20 text-emerald-600" strokeWidth={3} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-semibold">Congratulations!</h2>
                <p className="mt-2 text-base text-muted-foreground">Your withdrawal is pending.</p>
              </>
            )}
          </section>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-0 sm:px-6">
          <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-300/70 bg-[#061a16] text-white shadow-[0_10px_42px_rgba(16,185,129,0.2),0_0_22px_rgba(16,185,129,0.16)]" aria-label="Active account balance">
            <div className="p-5 sm:p-7">
              <p className="text-sm font-medium text-emerald-100/80">Available balance</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums sm:text-5xl">
                {auth.authState !== 'authenticated'
                  ? 'Sign in to view'
                  : activeWalletType === 'app_wallet' && isLoading
                    ? 'Loading…'
                    : money.format(activeWalletBalance)}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => handleWalletActionClick('deposit')}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors',
                    'border-emerald-200 bg-emerald-300 text-emerald-950 shadow-[0_0_18px_rgba(110,231,183,0.42)] hover:bg-emerald-200'
                  )}
                >
                  <ArrowDownToLine className="h-4 w-4" /> Deposit
                </button>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => handleWalletActionClick('withdraw')}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors',
                    'border-emerald-100/35 bg-emerald-950/70 text-white hover:bg-emerald-900'
                  )}
                >
                  <ArrowUpFromLine className="h-4 w-4" /> Withdraw
                </button>
              </div>
            </div>
          </section>

          <section className="mb-10 border-y border-border py-4" aria-labelledby="wallet-activity-heading">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="wallet-activity-heading" className="text-lg font-semibold">Transaction history</h2>
                <p className="mt-1 text-sm text-muted-foreground">View deposits, withdrawals, wallet activity, and trades.</p>
              </div>
              <Link href="/wallet/history" className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <History className="h-4 w-4" /> View full history
              </Link>
            </div>
          </section>

          <Dialog open={action !== null} onOpenChange={open => { if (!open) setAction(null); }}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-xl">
              {action === 'deposit' && (
                <>
                  <DialogHeader>
                    <DialogTitle>Deposit to Real Wallet</DialogTitle>
                    <DialogDescription>Choose a method and enter your payment details.</DialogDescription>
                  </DialogHeader>
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

                  <form className="space-y-4" onSubmit={startDeposit}>
                    <div>
                      <label htmlFor="wallet-amount" className="mb-2 block text-sm font-medium">Deposit amount (USD)</label>
                      <input
                        id="wallet-amount"
                        type="number"
                        inputMode="decimal"
                        min={minimumDepositUsd.toFixed(2)}
                        step="0.01"
                        required
                        value={amountUsd}
                        onChange={event => setAmountUsd(event.target.value)}
                        className="h-11 w-full border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Minimum {money.format(minimumDepositUsd)}. M-Pesa will be charged approximately KES {getKesAmount(amountUsd).toLocaleString('en-KE')} (rounded up to the next shilling).</p>
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
              )}
              {action === 'withdraw' && (
                <>
                  <DialogHeader>
                    <DialogTitle>Request an M-Pesa withdrawal</DialogTitle>
                    <DialogDescription>Enter the amount and M-Pesa details for your request.</DialogDescription>
                  </DialogHeader>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The withdrawal will be sent to the M-Pesa wallet you provide.
                  </p>
                  <form className="space-y-4" onSubmit={requestWithdrawal}>
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
                      {expectedWithdrawalKes !== null && (
                        <p className="mt-2 text-sm font-medium text-foreground" aria-live="polite">
                          Expected KES: {kesMoney.format(expectedWithdrawalKes)}
                        </p>
                      )}
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
                      {isSubmittingWithdrawal ? 'Processing…' : 'Withdraw now'}
                    </button>
                  </form>
                </>
              )}

              {message && (
                <p className={cn('text-sm leading-6', messageIsError ? 'text-destructive' : 'text-muted-foreground')} role="status" aria-live="polite">
                  {message}
                </p>
              )}
              {auth.authState !== 'authenticated' && action !== null && (
                <p className="text-sm text-muted-foreground">Sign in to submit a deposit or withdrawal request.</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}