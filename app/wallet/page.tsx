'use client';

import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  Landmark,
  Smartphone,
} from 'lucide-react';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { cn } from '@/lib/utils';

type WalletAction = 'deposit' | 'withdraw';
type PaymentMethod = 'bank-agent' | 'crypto' | 'mpesa';

const paymentMethods = [
  { id: 'bank-agent', label: 'Bank Agent', description: 'Local bank agent', Icon: Landmark },
  { id: 'crypto', label: 'Crypto', description: 'Digital assets', Icon: Bitcoin },
  { id: 'mpesa', label: 'M-Pesa', description: 'Mobile money', Icon: Smartphone },
] as const;

export default function WalletPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const [action, setAction] = useState<WalletAction>('deposit');
  const [method, setMethod] = useState<PaymentMethod>('bank-agent');
  const [amount, setAmount] = useState('');
  const [previewNotice, setPreviewNotice] = useState('');

  const submitPreview = () => {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setPreviewNotice('Enter an amount greater than zero to preview a request.');
      return;
    }

    setPreviewNotice('Preview only. No payment or withdrawal was created or sent.');
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
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-600">Account wallet</p>
              <h1 className="text-3xl font-semibold tracking-normal">Wallet</h1>
            </div>
            <p className="border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
              Preview only · Payments are not connected
            </p>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-sm text-muted-foreground">Real account balance</p>
              <p className="mt-1 text-xl font-semibold">Not connected</p>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              This wallet preview does not access Deriv account funds. Deposits and withdrawals are unavailable until a verified payment provider is integrated.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <section aria-labelledby="wallet-action-heading">
              <div className="mb-6 flex border-b border-border" role="tablist" aria-label="Wallet action">
                <button
                  type="button"
                  role="tab"
                  aria-selected={action === 'deposit'}
                  onClick={() => {
                    setAction('deposit');
                    setPreviewNotice('');
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
                    setPreviewNotice('');
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

              <h2 id="wallet-action-heading" className="mb-4 text-lg font-semibold">
                {action === 'deposit' ? 'Choose a deposit method' : 'Choose a withdrawal method'}
              </h2>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
                {paymentMethods.map(({ id, label, description, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={method === id}
                    onClick={() => {
                      setMethod(id);
                      setPreviewNotice('');
                    }}
                    className={cn(
                      'flex min-h-28 flex-col items-start justify-between border p-4 text-left transition-colors',
                      method === id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                    <span>
                      <span className="block text-sm font-semibold">
                        {action === 'withdraw' ? 'Withdraw with ' : 'Deposit with '}
                        {id === 'crypto' ? 'Crypto' : id === 'mpesa' ? 'M-Pesa' : 'Bank Agent'}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-7 max-w-sm">
                <label htmlFor="wallet-amount" className="mb-2 block text-sm font-medium">
                  Amount (USD)
                </label>
                <input
                  id="wallet-amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={event => {
                    setAmount(event.target.value);
                    setPreviewNotice('');
                  }}
                  placeholder="0.00"
                  className="h-11 w-full border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={submitPreview}
                  className="mt-4 h-11 w-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:min-w-48"
                >
                  Preview {action === 'deposit' ? 'deposit' : 'withdrawal'} request
                </button>
                {previewNotice && (
                  <p className="mt-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                    {previewNotice}
                  </p>
                )}
              </div>
            </section>

            <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h2 className="text-base font-semibold">{action === 'deposit' ? 'Deposit' : 'Withdrawal'} details</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="font-medium text-right">
                    {paymentMethods.find(item => item.id === method)?.label}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-medium tabular-nums">{amount ? `${amount} USD` : '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 pb-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">Preview only</dd>
                </div>
              </dl>
              <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-muted-foreground">
                No money is moved and no transaction is recorded from this page.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}