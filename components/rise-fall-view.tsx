'use client';

import dynamic from 'next/dynamic';
import { Localize } from '@deriv-com/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/custom/header';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { placeDemoTrade } from '@/app/actions/demo-trading';
import { computeEndTimeEpoch } from '@/lib/duration-utils';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';
import { TradeControls } from './trade-controls';
import { ConfigurableTradeControls } from './configurable-trade-controls';
import { DIGIT_CONTRACT_GROUPS, type DigitContractType, type Direction } from '../lib/types';
import { filterSymbolsByCategory, type MarketCategory, type TradeMode } from '../lib/market-symbol-filters';
import { MIN_TRADE_STAKE } from '@/lib/trading-constants';
import type { RiseFallAppConfig } from '../lib/app-config';

/**
 * A zone overlaid on the chart region. Two modes:
 *  - not-editable (no onClick): ⛔ "… · not editable" hint on hover.
 *  - selectable (onClick): clickable to select; ring highlights when selected.
 * Either way it blocks direct chart interaction in edit mode.
 */
function FixedZone({
  label,
  style,
  onClick,
  selected,
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  selected?: boolean;
}) {
  const { localize } = useAppTranslations();
  const selectable = !!onClick;
  return (
    <div
      className={`group/zone absolute left-0 right-0 z-[60] ${selectable ? 'cursor-pointer' : ''}`}
      style={style}
      onClick={onClick}
    >
      <div
        className={[
          'pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset transition-opacity',
          selected
            ? 'opacity-100 ring-primary'
            : 'opacity-0 ring-muted-foreground/30 group-hover/zone:opacity-100',
        ].join(' ')}
      >
        <span className="absolute left-3 top-2 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
          {!selectable && <Ban className="h-3.5 w-3.5" />}
          {selectable ? label : localize('{{label}} · not editable', { label })}
        </span>
      </div>
    </div>
  );
}
import type {
  ActiveSymbol,
  ProposalInfo,
  BuyResult,
  DerivWS,
} from '@deriv/core';
import type { SiteAuthState, SiteTradingAccount } from '@/components/custom/site-auth-provider';
import type { DurationSelectUnit, DurationOption } from '../lib/types';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { OpenPosition } from '../lib/types';

const RiseFallChart = dynamic(() => import('./rise-fall-chart').then(module => module.RiseFallChart), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-md border border-border/50 dark:border-white/[0.08] bg-muted/30" />
  ),
});

// Edit-mode stand-in for the login prompt's auth handlers — same rule as the
// header: no OAuth navigation out of the editor.
const noopAsyncAuth = async () => {};

type TradeTab = 'over-under' | 'even-odd' | 'matches-differs' | 'rise-fall' | 'forex-basket';

const TRADE_TABS: { id: TradeTab; label: string }[] = [
  { id: 'over-under', label: 'Over/Under' },
  { id: 'even-odd', label: 'Even/Odd' },
  { id: 'matches-differs', label: 'Matches/Differs' },
  { id: 'rise-fall', label: 'Rise/Fall' },
  { id: 'forex-basket', label: 'Forex Basket' },
];

export interface RiseFallViewProps {
  // Auth
  authState: SiteAuthState;
  accounts: SiteTradingAccount[];
  activeAccount: SiteTradingAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;

  // Connection / loading
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  /** Recent price window + pip size for the active symbol — powers the
   *  Symbol Selector's movement indicator when the chart is hidden. */
  prices?: number[];
  pipSize?: number;

  // Trade controls
  direction: Direction;
  setDirection: (direction: Direction) => void;
  allowEquals: boolean;
  setAllowEquals: (value: boolean) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data (elevated to page so preview can inject frozen mocks)
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;
  /**
   * Unix epoch (seconds) to freeze the chart at. When set, SmartCharts renders
   * a static historical snapshot and never sets up a live subscription.
   */
  endEpoch?: number;

  // Branding (used by preview route; no-op in the real app)
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;

  /**
   * No-code config. When provided, the trade controls render in configurable
   * styles/order (ConfigurableTradeControls). When omitted, the standard
   * TradeControls render unchanged.
   */
  appConfig?: RiseFallAppConfig;
  /** Edit mode — components become selectable (click opens their accordion). */
  editMode?: boolean;
  /** Called when an editable component is clicked (e.g. "chart", "stake"). */
  onSelect?: (key: string) => void;
  /** Currently selected component (highlighted). */
  selectedKey?: string | null;
  /** Rearrange mode — drag blocks in the phone to reorder the layout. */
  rearrangeMode?: boolean;
  /** Called with the new block order after a drag-drop reorder. */
  onReorder?: (order: RiseFallAppConfig['order']) => void;
}

export function RiseFallView({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  ws,
  isConnected,
  isLoading,
  error,
  symbols,
  activeSymbol,
  selectSymbol,
  prices,
  pipSize,
  direction,
  setDirection,
  allowEquals,
  setAllowEquals,
  stake,
  setStake,
  duration,
  setDuration,
  durationOptions,
  durationUnit,
  setDurationUnit,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
  chartData,
  getQuotes,
  subscribeQuotes,
  unsubscribeQuotes,
  isLive,
  endEpoch,
  logoSrc,
  appName,
  showAppName,
  appConfig,
  editMode,
  onSelect,
  selectedKey,
  rearrangeMode,
  onReorder,
}: RiseFallViewProps) {
  const { localize } = useAppTranslations();
  const isMobile = useIsMobile();
  const chartHidden = appConfig?.chart?.hidden ?? false;
  const [activeTab, setActiveTab] = useState<TradeTab>('over-under');
  const marketCategory: MarketCategory = activeTab === 'forex-basket' ? 'forex' : 'volatility';
  const marketSymbols = useMemo(
    () => filterSymbolsByCategory(symbols, marketCategory),
    [symbols, marketCategory]
  );
  const tradeMode: TradeMode = activeTab === 'forex-basket'
    ? 'market-only'
    : activeTab === 'rise-fall'
      ? 'rise-fall'
      : 'digits';
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);
  const { openAuth, refresh: refreshSiteAuth } = useSiteAuth();
  const [isPlacingDemoTrade, setIsPlacingDemoTrade] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DigitContractType>('OVER');

  useEffect(() => {
    if (marketSymbols.length > 0 && !marketSymbols.some(symbol => symbol.underlying_symbol === activeSymbol?.underlying_symbol)) {
      selectSymbol(marketSymbols[0].underlying_symbol);
    }
  }, [marketSymbols, activeSymbol?.underlying_symbol, selectSymbol]);

  // Logged-out Buy opens the login/sign-up prompt instead of sending a buy that
  // would fail with a "Purchase Failed" toast. One gate covers every Buy
  // surface (standard, configurable, pinned). Edit mode stays inert — the
  // editor owns Buy clicks there, and its auth actions are already no-ops.
  const handleBuy = useCallback(async () => {
    if (editMode) return;

    if (durationUnit !== 's') {
      toast.error('Only tick durations are supported for this market.');
      return;
    }

    const selectedDuration = Number(duration);
    if (!/^\d+$/.test(duration) || !Number.isSafeInteger(selectedDuration) || selectedDuration < 1) {
      toast.error('Enter a valid tick count for the expiry.');
      return;
    }

    toast.error('Legacy rise/fall contracts are disabled. This market now uses the digit contract types only.');
    return;
  }, [editMode, duration, durationUnit]);

  const handleRiseFallBuy = useCallback(async (tradeDirection: Direction) => {
    if (editMode) return;
    if (authState !== 'authenticated') {
      await openAuth('login');
      return;
    }
    if (!activeSymbol || !marketSymbols.some(symbol => symbol.underlying_symbol === activeSymbol.underlying_symbol)) {
      toast.error('Select a continuous volatility index before trading.');
      return;
    }

    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake < MIN_TRADE_STAKE || numericStake > 10000) {
      toast.error(`Enter a valid stake of at least $${MIN_TRADE_STAKE.toFixed(2)}.`);
      return;
    }
    const durationSeconds = Number(duration);
    if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 15 || durationSeconds > 300) {
      toast.error('Enter a duration from 15 to 300 seconds.');
      return;
    }

    setIsPlacingDemoTrade(true);
    try {
      const result = await placeDemoTrade({
        symbol: activeSymbol.underlying_symbol,
        contractType: tradeDirection,
        stake: numericStake,
        duration: durationSeconds,
        durationUnit: 's',
        fundingSource: activeAccount?.account_type === 'app_wallet' ? 'app_wallet' : 'demo',
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Rise/Fall trade placed. It will settle when the contract expires.');
      await refreshSiteAuth();
    } catch {
      toast.error('Could not place the Rise/Fall trade.');
    } finally {
      setIsPlacingDemoTrade(false);
    }
  }, [editMode, authState, openAuth, activeSymbol, marketSymbols, stake, duration, activeAccount, refreshSiteAuth]);

  const tradeIsPending = isBuying || isPlacingDemoTrade;

  // In edit mode, login/sign-up/account actions are inert (no OAuth navigation
  // out of the editor) — only the theme toggle stays interactive.
  const headerEl = useMemo(() => {
    const noop = () => {};
    const noopAsync = async () => {};
    return (
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={editMode ? noopAsync : onLogin}
        onSignUp={editMode ? noopAsync : onSignUp}
        onLogout={editMode ? noop : onLogout}
        onSwitchAccount={editMode ? noopAsync : onSwitchAccount}
        logoSrc={logoSrc}
        appName={appName}
        showAppName={showAppName}
        actions={<ThemeToggle />}
      />
    );
  }, [
    authState,
    accounts,
    activeAccount,
    editMode,
    onLogin,
    onSignUp,
    onLogout,
    onSwitchAccount,
    logoSrc,
    appName,
    showAppName,
  ]);

  // The chart + symbol block. Used in the standard 2-column layout (left column)
  // and as a reorderable block in the no-code layout. When the chart is hidden,
  // the SmartChart is NOT mounted at all (so nothing bleeds through) and a
  // standalone Symbol Selector takes its place so users can still switch markets.
  const chartBlock = useMemo(
    () =>
      chartHidden ? (
        <div className="rf-chart-hidden relative">
          <div className={editMode ? 'pointer-events-none select-none' : ''}>
            <SymbolSelector
              symbols={marketSymbols}
              activeSymbol={activeSymbol}
              onSymbolChange={selectSymbol}
              prices={prices}
              pipSize={pipSize}
            />
          </div>
          {editMode && !rearrangeMode && (
            <FixedZone label={localize('Symbol picker')} style={{ top: 0, bottom: 0 }} />
          )}
        </div>
      ) : (
        <div className="rf-chart-frame relative">
          <div className={`h-full ${editMode ? 'pointer-events-none select-none' : ''}`}>
            {chartData ? (
              <RiseFallChart
                symbolKey={activeSymbol?.underlying_symbol ?? 'rise-fall-chart'}
                symbol={activeSymbol?.underlying_symbol}
                isConnectionOpened={isConnected}
                isMobile={isMobile}
                chartData={chartData}
                getQuotes={getQuotes}
                subscribeQuotes={subscribeQuotes}
                unsubscribeQuotes={unsubscribeQuotes}
                isLive={isLive}
                endEpoch={endEpoch}
                contractsArray={contractMarkers}
              />
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>

          <div className={`absolute left-2 right-2 top-2 z-[100] ${editMode ? 'pointer-events-none select-none' : ''}`}>
            <SymbolSelector
              symbols={marketSymbols}
              activeSymbol={activeSymbol}
              onSymbolChange={selectSymbol}
              prices={prices}
              pipSize={pipSize}
            />
          </div>

          {editMode && !rearrangeMode && (
            <>
              <FixedZone label={localize('Symbol picker')} style={{ top: 0, height: 54 }} />
              <FixedZone label={localize('Chart')} style={{ top: 54, bottom: 0 }} />
            </>
          )}
        </div>
      ),
    [
      chartHidden,
      marketSymbols,
      prices,
      pipSize,
      editMode,
      chartData,
      activeSymbol,
      isConnected,
      isMobile,
      getQuotes,
      subscribeQuotes,
      unsubscribeQuotes,
      selectSymbol,
      isLive,
      endEpoch,
      contractMarkers,
      rearrangeMode,
      localize,
    ]
  );

  if (error) {
    return (
      <main className="flex flex-col bg-background items-center justify-center px-4 min-h-dvh">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              <Localize i18n_default_text="Connection Error" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // The configurable controls. `withChart` includes the chart as a reorderable
  // block in the single column (mobile); on desktop the chart is its own column,
  // so it's omitted here.
  const renderConfigurable = (withChart: boolean) =>
    appConfig ? (
      <ConfigurableTradeControls
        config={appConfig}
        chartSlot={withChart ? chartBlock : undefined}
        direction={direction}
        onDirectionChange={setDirection}
        allowEquals={allowEquals}
        onAllowEqualsChange={setAllowEquals}
        isConnected={isConnected}
        stake={stake}
        onStakeChange={setStake}
        duration={duration}
        onDurationChange={setDuration}
        durationOptions={durationOptions}
        durationUnit={durationUnit}
        onDurationUnitChange={setDurationUnit}
        endDate={endDate}
        onEndDateChange={setEndDate}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        ws={ws}
        activeSymbol={activeSymbol}
        marketPrice={prices?.at(-1) ?? null}
        marketPrecision={pipSize ?? 2}
        proposal={proposal}
        onBuy={handleBuy}
        isBuying={tradeIsPending}
        buyResult={buyResult}
        buyError={buyError}
        onClearBuyResult={clearBuyResult}
        isAuthenticated={authState === 'authenticated'}
        editMode={editMode}
        onSelect={onSelect}
        selectedKey={selectedKey}
        rearrangeMode={rearrangeMode}
        onReorder={onReorder}
        selectedContract={selectedContract}
        onSelectedContractChange={setSelectedContract}
        tradeMode={tradeMode}
        onRiseFallBuy={handleRiseFallBuy}
      />
    ) : null;

  return (
    <>
      <main
      className={`flex h-dvh min-h-0 w-full flex-col overflow-hidden ${
        editMode ? 'bg-muted/50' : 'bg-background'
      }`}
    >
      {editMode ? (
        <div className="group/hdr sticky top-0 z-50">
          {headerEl}
          {/* Hover hint: a ring + a LEFT-aligned chip so it never covers the
              right-side theme toggle (which stays usable). pointer-events-none
              so nothing here blocks clicks. */}
          <div className="pointer-events-none absolute inset-0 z-[60] opacity-0 ring-2 ring-inset ring-muted-foreground/25 transition-opacity group-hover/hdr:opacity-100">
            <span className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
              <Ban className="h-3.5 w-3.5" />
              <Localize i18n_default_text="Not editable" />
            </span>
          </div>
        </div>
      ) : (
        headerEl
      )}

      {!editMode && !rearrangeMode && (
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2" aria-label="Trading market and contract type">
          {TRADE_TABS.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'over-under') setSelectedContract(DIGIT_CONTRACT_GROUPS[0].contracts[0]);
                  if (tab.id === 'even-odd') setSelectedContract(DIGIT_CONTRACT_GROUPS[1].contracts[0]);
                  if (tab.id === 'matches-differs') setSelectedContract(DIGIT_CONTRACT_GROUPS[2].contracts[0]);
                  if (tab.id === 'rise-fall') setDuration('60');
                }}
                className={`min-h-10 shrink-0 rounded-md px-3 text-xs font-semibold transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      {appConfig ? (
        isMobile ? (
          /* No-code mobile layout: a single, reorderable column of blocks. The
             chart + symbol dropdown is one block (chartSlot); controls follow
             the configured order. */
          <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0">
            {isLoading ? <Skeleton className="h-[42dvh] w-full" /> : renderConfigurable(true)}
          </div>
        ) : chartHidden ? (
          /* No-code desktop, chart OFF: a single centered column (symbol picker
             + controls stacked) at the controls' width — no wide empty chart
             column, and the height grows to fit its content (no inner scroll). */
          <div className="w-full flex-1 min-h-0 overflow-y-auto p-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              renderConfigurable(true)
            )}
          </div>
        ) : (
          /* No-code desktop, chart ON: 2-column (chart left, controls card
             right). The card grows to its content height (no fixed height /
             inner scrollbar) — desktop has the vertical space. */
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <div className="rf-workspace-grid h-full min-h-0">
              <div className="min-w-0 min-h-0">{chartBlock}</div>
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="min-h-0 overflow-y-auto border-l border-border px-5 py-4">
                  {renderConfigurable(false)}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Standard layout (unchanged): 2-column chart + controls card. */
        <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0 lg:overflow-hidden">
          <div className="rf-workspace-grid min-h-full lg:h-full lg:min-h-0">
            <div className="min-w-0 min-h-0">
              {chartBlock}
            </div>
            <div className="min-h-0 overflow-y-auto border-t border-border p-4 lg:border-l lg:border-t-0">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <TradeControls
                  direction={direction}
                  onDirectionChange={setDirection}
                  allowEquals={allowEquals}
                  onAllowEqualsChange={setAllowEquals}
                  isConnected={isConnected}
                  stake={stake}
                  onStakeChange={setStake}
                  duration={duration}
                  onDurationChange={setDuration}
                  durationOptions={durationOptions}
                  durationUnit={durationUnit}
                  onDurationUnitChange={setDurationUnit}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  endTime={endTime}
                  onEndTimeChange={setEndTime}
                  ws={ws}
                  activeSymbol={activeSymbol}
                  marketPrice={prices?.at(-1) ?? null}
                  marketPrecision={pipSize ?? 2}
                  proposal={proposal}
                  onBuy={handleBuy}
                  isBuying={tradeIsPending}
                  buyResult={buyResult}
                  buyError={buyError}
                  onClearBuyResult={clearBuyResult}
                  isAuthenticated={authState === 'authenticated'}
                  selectedContract={selectedContract}
                  onSelectedContractChange={setSelectedContract}
                  tradeMode={tradeMode}
                  onRiseFallBuy={direction => void handleRiseFallBuy(direction)}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </main>
    </>
  );
}
