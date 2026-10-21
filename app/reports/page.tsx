'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth, type SitePaperTrade } from '@/components/custom/site-auth-provider';
import { useDemoTradeSettlement } from '@/hooks/use-demo-trade-settlement';

type TradeFilter = 'all' | 'open' | 'settled';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatTradeDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMarketPrice(value: number | string | null, precision?: number) {
  if (value === null) return '—';
  const price = Number(value);
  if (!Number.isFinite(price)) return '—';

  const inferredPrecision = String(value).split('.')[1]?.replace(/0+$/, '').length ?? 0;
  const digits = Math.max(0, Math.min(10, precision ?? inferredPrecision));
  return price.toFixed(digits);
}

function TradeRow({ trade }: { trade: SitePaperTrade }) {
  const stake = Number(trade.stake);
  const payout = Number(trade.payout);
  const profit = trade.status === 'open' ? null : payout - stake;
  const contract = trade.contract_type === 'CALL' ? 'Rise'
    : trade.contract_type === 'PUT' ? 'Fall'
      : trade.contract_type === 'CALLE' ? 'Rise (Equal)'
        : trade.contract_type === 'PUTE' ? 'Fall (Equal)'
          : trade.contract_type === 'OVER' ? 'Over'
            : trade.contract_type === 'UNDER' ? 'Under'
              : trade.contract_type === 'EVEN' ? 'Even'
                : trade.contract_type === 'ODD' ? 'Odd'
                  : trade.contract_type === 'MATCH' ? 'Matches' : 'Differs';

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 font-medium">{contract}</td>
      <td className="px-4 py-3">{trade.symbol}</td>
      <td className="px-4 py-3 text-right tabular-nums">{money.format(stake)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatMarketPrice(trade.entry_quote, trade.price_precision)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatMarketPrice(trade.exit_quote, trade.price_precision)}</td>
      <td className="px-4 py-3 text-right capitalize">{trade.status}</td>
      <td className={`px-4 py-3 text-right tabular-nums ${profit === null ? 'text-muted-foreground' : profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
        {profit === null ? '—' : money.format(profit)}
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground">{formatTradeDate(trade.created_at)}</td>
    </tr>
  );
}

export default function ReportsPage() {
  const logoSrc = useLogoSrc();
  const auth = useSiteAuth();
  useDemoTradeSettlement({
    authState: auth.authState,
    paperTrades: auth.paperTrades,
    digitTrades: auth.digitTrades,
    refresh: auth.refresh,
  });
  const [filter, setFilter] = useState<TradeFilter>('all');
  const accountFilter = auth.activeAccount?.account_type === 'app_wallet' ? 'app_wallet' : 'demo';
  const combinedTrades = [...auth.paperTrades, ...auth.digitTrades].sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
  const accountTrades = combinedTrades.filter(trade => (trade.funding_source ?? 'demo') === accountFilter);
  const visibleTrades = accountTrades.filter(trade =>
    filter === 'all' || (filter === 'open' ? trade.status === 'open' : trade.status !== 'open')
  );
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
      <div className="w-full min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:px-6 lg:pb-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {accountFilter === 'app_wallet' ? 'Real Wallet' : 'Demo account'}
            </p>
            <h1 className="text-lg font-semibold">Trade history</h1>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            <Localize i18n_default_text="Back to trading" />
          </Link>
        </div>

        {auth.authState !== 'authenticated' ? (
          <div className="border-y border-border py-10 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {auth.authState === 'unconfigured'
                ? 'Configure Supabase to view your simulated trade history.'
                : auth.authState === 'loading'
                  ? 'Loading account…'
                  : 'Sign in to view your simulated trade history.'}
            </p>
            {auth.authState === 'unauthenticated' && (
              <Button onClick={() => auth.openAuth('login')}>Log in</Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-1 border-b border-border" role="tablist" aria-label="Trade filter">
              {(['all', 'open', 'settled'] as const).map(value => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={`border-b-2 px-3 py-2 text-sm capitalize ${filter === value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                >
                  {value}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{visibleTrades.length} trades</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[58rem] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Contract</th>
                    <th className="px-4 py-2 font-medium">Market</th>
                    <th className="px-4 py-2 text-right font-medium">Stake</th>
                    <th className="px-4 py-2 text-right font-medium">Entry price</th>
                    <th className="px-4 py-2 text-right font-medium">Exit price</th>
                    <th className="px-4 py-2 text-right font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">P&amp;L</th>
                    <th className="px-4 py-2 text-right font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrades.map(trade => <TradeRow key={trade.id} trade={trade} />)}
                  {visibleTrades.length === 0 && (
                    <tr className="border-t border-border">
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No {accountFilter === 'app_wallet' ? 'Real Wallet' : 'Demo account'} trades to show.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
