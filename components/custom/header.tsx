'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FocusScope } from '@radix-ui/react-focus-scope';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, History, LogOut, RefreshCw, UserRound, Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { LanguageSwitcher } from '@/components/custom/language-switcher';
import { useSiteAuth, type SiteAccountType, type SiteAuthState, type SiteTradingAccount } from './site-auth-provider';

interface HeaderProps {
  authState: SiteAuthState;
  accounts: SiteTradingAccount[];
  activeAccount: SiteTradingAccount | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => void | Promise<void>;
  /** When provided, a Sign up button is rendered to the right of the Log in button. */
  onSignUp?: () => Promise<void>;
  /** Logo source URL or data URL. When omitted, a placeholder badge is shown until
   *  the user provides a logo via the app builder (passed as a data URL via PREVIEW_BRANDING). */
  logoSrc?: string;
  /** App name used for the header text and fallback logo letter. */
  appName?: string;
  /** When false, hide the name text next to the logo. */
  showAppName?: boolean;
  /** Optional controls rendered to the left of the login/logout button (e.g. a theme toggle). */
  actions?: React.ReactNode;
  appWalletBalance?: number;
  showAccountBalance?: boolean;
}

function formatBalance(balance: string | number, locale: string): string {
  return Number(balance).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AccountLabel({ type }: { type: SiteAccountType }) {
  return (
    <span
      className={cn(
        'text-sm font-medium whitespace-nowrap truncate',
        type === 'demo' ? 'text-orange-500' : 'text-emerald-600'
      )}
    >
      {type === 'app_wallet' ? (
        'Real Wallet'
      ) : type === 'demo' ? (
        <Localize i18n_default_text="Demo account" />
      ) : (
        <Localize i18n_default_text="Real account" />
      )}
    </span>
  );
}

function resolveHeaderAppName(appName?: string): string {
  return appName?.trim() || 'CRYPTO BINARY';
}

function resolveShowAppName(showAppName?: boolean): boolean {
  return showAppName ?? true;
}

function AuthButtons({
  isAuthenticated,
  isAuthenticating,
  onLogin,
  onLogout,
  onSignUp,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSignUp?: () => Promise<void>;
}) {
  if (isAuthenticated) {
    return (
      <Button variant="outline" size="sm" className="shrink-0" onClick={onLogout}>
        <Localize i18n_default_text="Log out" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onLogin} disabled={isAuthenticating}>
        {isAuthenticating ? (
          <Localize i18n_default_text="Logging in..." />
        ) : (
          <Localize i18n_default_text="Log in" />
        )}
      </Button>
      {onSignUp && (
        <Button size="sm" onClick={onSignUp} disabled={isAuthenticating}>
          <Localize i18n_default_text="Sign up" />
        </Button>
      )}
    </div>
  );
}

function preventDismissFromPopoverOrHeader(event: {
  preventDefault: () => void;
  target: EventTarget | null;
  detail?: { originalEvent?: Event };
}) {
  const node = event.detail?.originalEvent?.target ?? event.target;
  if (
    node instanceof Element &&
    node.closest('[data-radix-popper-content-wrapper], [data-radix-popover-content], header')
  ) {
    event.preventDefault();
  }
}

const APPEARANCE_OPTIONS = ['light', 'dark', 'system'] as const;
const PRIMARY_NAV_ITEMS = [
  { href: '/', label: 'Traders Hub', Icon: Activity },
  { href: '/account', label: 'Account', Icon: UserRound },
  { href: '/wallet', label: 'Wallet', Icon: Wallet },
] as const;

function isPrimaryRouteActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function AppearanceLabel({ value }: { value: (typeof APPEARANCE_OPTIONS)[number] }) {
  if (value === 'light') return <Localize i18n_default_text="Light" />;
  if (value === 'dark') return <Localize i18n_default_text="Dark" />;
  return <Localize i18n_default_text="System" />;
}

function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = theme === 'light' || theme === 'dark' ? theme : 'system';

  const handleSelect = (value: (typeof APPEARANCE_OPTIONS)[number]) => {
    setTheme(value);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        <Localize i18n_default_text="Appearance" />
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative w-full h-11 font-semibold justify-start text-left gap-1.5 px-3"
          >
            <span className="text-xs font-semibold tracking-wide">
              <AppearanceLabel value={selected} />
            </span>
            <svg
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform absolute right-3',
                open && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </PopoverTrigger>
        {/* Above edit-mode FixedZones (z-[60]); shared PopoverContent is z-50. */}
        <PopoverContent
          align="end"
          className="z-[100] w-[var(--radix-popover-trigger-width)] min-w-0 p-1"
        >
          <ul className="space-y-0.5">
            {APPEARANCE_OPTIONS.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                    option === selected ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                  )}
                >
                  <AppearanceLabel value={option} />
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MobileAuthButtons({
  isAuthenticated,
  isAuthenticating,
  onLogin,
  onLogout,
  onSignUp,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSignUp?: () => Promise<void>;
}) {
  const className = 'w-full h-11 font-semibold';

  if (isAuthenticated) {
    return (
      <Button variant="outline" className={className} onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        <Localize i18n_default_text="Log out" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(className, 'bg-transparent hover:bg-transparent')}
        onClick={onLogin}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Localize i18n_default_text="Logging in..." />
        ) : (
          <Localize i18n_default_text="Log in" />
        )}
      </Button>
      {onSignUp && (
        <Button className={className} onClick={onSignUp} disabled={isAuthenticating}>
          <Localize i18n_default_text="Sign up" />
        </Button>
      )}
    </>
  );
}

export function Header({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onLogout,
  onSwitchAccount,
  onSignUp,
  logoSrc,
  appName,
  showAppName,
  actions,
  appWalletBalance: appWalletBalanceOverride,
  showAccountBalance = true,
}: HeaderProps) {
  const { currentLang, localize } = useAppTranslations();
  const { isAdmin } = useSiteAuth();
  const numberLocale = LANGUAGE_LOCALES[currentLang];
  const [logoError, setLogoError] = useState(false);
  const resolvedName = resolveHeaderAppName(appName);
  const shouldShowName = resolveShowAppName(showAppName);
  const logoLetter = resolvedName.charAt(0).toUpperCase() || 'D';
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appWalletBalance, setAppWalletBalance] = useState<number | null>(null);
  const pathname = usePathname();
  const isAppWalletSelected = activeAccount?.account_type === 'app_wallet';
  const displayedAppWalletBalance = activeAccount?.account_type === 'app_wallet'
    ? Number(activeAccount.balance)
    : appWalletBalanceOverride ?? appWalletBalance;
  const headerRef = useRef<HTMLElement>(null);
  const [menuTop, setMenuTop] = useState(0);
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'loading';

  useEffect(() => {
    if (!isAuthenticated) {
      setAppWalletBalance(null);
      return;
    }

    let cancelled = false;
    fetch('/api/wallet', { cache: 'no-store' })
      .then(async response => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || typeof data !== 'object' || data === null || !('balanceUsd' in data)) {
          throw new Error('Wallet unavailable');
        }
        const balance = Number(data.balanceUsd);
        if (!Number.isFinite(balance)) throw new Error('Invalid wallet balance');
        if (!cancelled) setAppWalletBalance(balance);
      })
      .catch(() => {
        if (!cancelled) setAppWalletBalance(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useLayoutEffect(() => {
    if (!mobileMenuOpen) return;
    const el = headerRef.current;
    const sync = () => {
      if (el) setMenuTop(el.getBoundingClientRect().bottom);
    };
    sync();
    window.addEventListener('resize', sync);
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)') : null;
    const closeIfLg = () => {
      if (mq?.matches) setMobileMenuOpen(false);
    };
    mq?.addEventListener('change', closeIfLg);
    return () => {
      window.removeEventListener('resize', sync);
      mq?.removeEventListener('change', closeIfLg);
    };
  }, [mobileMenuOpen]);

  const headerBar = (
      <header ref={headerRef} className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 shrink-0">
        {!logoSrc || logoError ? (
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {logoLetter}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- next/image is avoided here intentionally: it errors in the optimizer when /logo.png is absent locally; a plain img with onError gives the same silent fallback behaviour
          <img
            src={logoSrc}
            alt={localize('App Logo')}
            className="h-8 w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        )}
        {shouldShowName && (
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">
            {resolvedName}
          </h1>
        )}
      </div>
      {isAuthenticated && (
        <nav className="hidden lg:flex flex-1 justify-center" aria-label="Primary navigation">
          <div className="flex items-center gap-1">
            {PRIMARY_NAV_ITEMS.map(({ href, label }) => {
              const active = isPrimaryRouteActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Refresh page"
          title="Refresh page"
          onClick={() => window.location.reload()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors duration-100 hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {actions}
          <LanguageSwitcher />
        </div>
        {isAuthenticated && pathname === '/' && (
          <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0 sm:w-auto sm:px-3" aria-label="Trade history">
            <Link href="/reports" title="Trade history">
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </Button>
        )}
        {isAuthenticated && (
          <Popover open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
            <PopoverTrigger asChild>
              <button className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 text-left">
                  <span className={cn(
                    'text-sm font-medium whitespace-nowrap truncate',
                    isAppWalletSelected ? 'text-emerald-600' : 'text-orange-500'
                  )}>
                    {activeAccount?.account_type === 'app_wallet' ? 'Real Wallet' : activeAccount ? 'Demo Wallet' : 'Select account'}
                  </span>
                  {showAccountBalance && (
                    <p className="text-base font-bold text-foreground whitespace-nowrap truncate">
                      {activeAccount?.account_type === 'app_wallet'
                        ? displayedAppWalletBalance === null
                          ? '—'
                          : `${formatBalance(displayedAppWalletBalance, numberLocale)} USD`
                        : activeAccount
                          ? `${formatBalance(activeAccount.balance, numberLocale)} ${activeAccount.currency}`
                          : '—'}
                    </p>
                  )}
                  {activeAccount?.account_type === 'app_wallet' && (
                    <span className="block text-xs text-muted-foreground"></span>
                  )}
                </div>
                <svg
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    accountSwitcherOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="z-[100] w-64 p-2">
              <div className="space-y-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setAccountSwitcherOpen(false)}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50"
                  >
                    Admin dashboard
                  </Link>
                )}
                {accounts.filter(account => account.account_type === 'demo' || account.account_type === 'app_wallet').map((account) => (
                  <Link
                    key={account.id}
                    href={pathname}
                    onClick={() => {
                      void onSwitchAccount(account.id);
                      setAccountSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                      account.id === activeAccount?.id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <AccountLabel type={account.account_type} />
                    <p className="text-base font-bold text-foreground">
                      {account.account_type === 'real'
                        ? 'Not connected'
                        : `${formatBalance(account.balance, numberLocale)} ${account.currency}`}
                    </p>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <AuthButtons
            isAuthenticated={isAuthenticated}
            isAuthenticating={isAuthenticating}
            onLogin={onLogin}
            onLogout={onLogout}
            onSignUp={onSignUp}
          />
        </div>
      </div>
      </header>
  );

  return (
    <>
    <DialogPrimitive.Root modal={false} open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      {/* modal=false keeps the header X and portaled popovers interactive */}
      {headerBar}
      {/* Portal to body: Content is position:fixed z-[100], but a class z-index is
          trapped in the edit-mode `sticky z-50` wrapper, so chart FixedZones at
          z-[60] still steal Appearance/Language clicks ("Gráfico · no editable"). */}
      <DialogPrimitive.Portal>
      <FocusScope loop trapped={mobileMenuOpen}>
      <DialogPrimitive.Content
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[100] flex flex-col bg-background lg:hidden outline-none"
        style={{ top: menuTop }}
        onPointerDownOutside={preventDismissFromPopoverOrHeader}
        onInteractOutside={preventDismissFromPopoverOrHeader}
        onFocusOutside={preventDismissFromPopoverOrHeader}
      >
        <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-6">
          <div className="space-y-2 text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              <Localize i18n_default_text="Your preferences" />
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              <Localize i18n_default_text="A space that feels like you." />
            </DialogPrimitive.Description>
          </div>
          <AppearancePicker />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              <Localize i18n_default_text="Language" />
            </p>
            <LanguageSwitcher className="w-full h-11 font-semibold" />
          </div>
        </div>
        <div className="mt-auto px-6 pb-8 pt-4 flex flex-col gap-3 border-t border-border">
          <MobileAuthButtons
            isAuthenticated={isAuthenticated}
            isAuthenticating={isAuthenticating}
            onLogin={onLogin}
            onLogout={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            onSignUp={onSignUp}
          />
        </div>
      </DialogPrimitive.Content>
      </FocusScope>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {isAuthenticated && (
        <nav
          className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-sm backdrop-blur lg:hidden"
          aria-label="Primary navigation"
        >
          <div className="grid h-16 grid-cols-3">
            {PRIMARY_NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isPrimaryRouteActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      </>
  );
}
