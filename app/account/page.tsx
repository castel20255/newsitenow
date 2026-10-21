'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Header } from '@/components/custom/header';
import { LanguageSwitcher } from '@/components/custom/language-switcher';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const auth = useSiteAuth();
  const logoSrc = useLogoSrc();
  const router = useRouter();
  const logOut = async () => {
    try {
      await auth.logout();
    } finally {
      router.replace('/');
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

  const profile = auth.profile;
  const details = [
    ['Full name', profile?.full_name],
    ['Username', profile?.username ? `@${profile.username}` : null],
    ['Email', auth.user?.email],
    ['Phone', profile?.phone_e164],
    ['Country', profile ? `${profile.country_name} (${profile.country_code})` : null],
    ['Terms accepted', profile?.terms_accepted_at
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(profile.terms_accepted_at))
      : null],
  ] as const;

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-8">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-8 border-b border-border pb-5">
            <p className="mb-2 text-sm font-medium text-emerald-600">Profile</p>
            <h1 className="text-3xl font-semibold">Account</h1>
          </div>

          {auth.authState === 'authenticated' ? (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
              <section aria-labelledby="account-details-heading">
                <h2 id="account-details-heading" className="mb-4 text-lg font-semibold">Your details</h2>
                <dl className="divide-y divide-border border-y border-border">
                  {details.map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-4 sm:grid-cols-[minmax(140px,0.55fr)_1fr] sm:gap-6">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="break-words text-sm font-medium">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-labelledby="account-settings-heading" className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <h2 id="account-settings-heading" className="mb-5 text-lg font-semibold">Settings</h2>
                <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                  <div>
                    <p className="text-sm font-medium">Appearance</p>
                    <p className="mt-1 text-xs text-muted-foreground">Light or dark theme</p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                  <div>
                    <p className="text-sm font-medium">Language</p>
                    <p className="mt-1 text-xs text-muted-foreground">Choose your display language</p>
                  </div>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                  <div>
                    <p className="text-sm font-medium">Log out</p>
                    <p className="mt-1 text-xs text-muted-foreground">Sign out of your account</p>
                  </div>
                  <Button variant="outline" onClick={() => void logOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <div className="border-y border-border py-10">
              <p className="mb-4 text-sm text-muted-foreground">
                {auth.authState === 'loading'
                  ? 'Loading account details…'
                  : auth.authState === 'unconfigured'
                    ? 'Account details are unavailable until Supabase is configured.'
                    : 'Sign in to view your account details and settings.'}
              </p>
              {auth.authState === 'unauthenticated' && (
                <Button onClick={() => auth.openAuth('login')}>Log in</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}