'use client';

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, EyeOff, Search } from 'lucide-react';
import { getCountries, getCountryCallingCode, isValidPhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { signInAccount, signUpAccount } from '@/app/actions/account-auth';
import type { AuthActionState } from '@/app/actions/account-auth';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = getCountries()
  .map(code => ({
    code,
    name: regionNames.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const initialActionState: AuthActionState = { status: 'idle', message: '' };

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="pr-11"
          required
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function CountryPicker({
  value,
  onChange,
}: {
  value: CountryCode | null;
  onChange: (code: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = countries.find(country => country.code === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;
    return countries.filter(country =>
      country.name.toLowerCase().includes(normalized)
      || country.code.toLowerCase() === normalized
      || `+${country.callingCode}`.includes(normalized)
    );
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between font-normal">
          <span className="truncate text-left">{selected ? selected.name : 'Select a country'}</span>
          <span className="ml-3 shrink-0 text-muted-foreground">{selected ? `+${selected.callingCode}` : ''}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-2">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search country or code"
            className="pl-9"
            autoComplete="off"
          />
        </div>
        <div role="listbox" aria-label="Countries" className="max-h-56 overflow-y-auto">
          {filtered.length ? filtered.map(country => (
            <button
              type="button"
              role="option"
              aria-selected={country.code === value}
              key={country.code}
              onClick={() => {
                onChange(country.code);
                setQuery('');
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span>{country.name}</span>
              <span className="ml-3 text-muted-foreground">+{country.callingCode}</span>
            </button>
          )) : (
            <p className="px-3 py-5 text-center text-sm text-muted-foreground">No countries found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SiteAuthDialog() {
  const pathname = usePathname();
  const {
    authDialogOpen,
    authDialogMode,
    closeAuth,
    openAuth,
    isConfigured,
    refresh,
  } = useSiteAuth();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<AuthActionState>(initialActionState);
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    closeAuth();
  }, [pathname, closeAuth]);

  const selectedCountry = countries.find(country => country.code === countryCode);
  const loginReady = Boolean(identifier.trim() && password.length > 0);
  const normalizedUsername = username.trim();
  const formReady = Boolean(
    normalizedUsername.length >= 3
    && normalizedUsername.length <= 24
    && !/[\u0000-\u001f\u007f]/.test(username)
    && fullName.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && countryCode
    && selectedCountry
    && isValidPhoneNumber(phoneNumber, countryCode)
    && password.length >= 6
    && password === passwordConfirmation
    && termsAccepted
  );

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage(initialActionState);
      const result = await signInAccount(initialActionState, formData);
      setMessage(result);
      if (result.status === 'success') {
        await refresh();
        closeAuth();
      }
    });
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage(initialActionState);
      const result = await signUpAccount(initialActionState, formData);
      setMessage(result);
      if (result.status === 'success' && !result.confirmationRequired) {
        await refresh();
        closeAuth();
      }
    });
  };

  return (
    <Dialog open={authDialogOpen} onOpenChange={open => !open && closeAuth()}>
      <DialogContent className="max-h-[90dvh] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border-border/70 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
        <DialogHeader>
          <DialogTitle>{authDialogMode === 'signup' ? 'Create a trading account' : 'Welcome back'}</DialogTitle>
          <DialogDescription>
            {authDialogMode === 'signup'
              ? 'Use a $10,000 Demo balance to learn, or fund your Real Wallet using supported payment methods.'
              : 'Sign in with your email or username.'}
          </DialogDescription>
        </DialogHeader>

        {authDialogMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                name="identifier"
                autoComplete="username"
                value={identifier}
                onChange={event => setIdentifier(event.target.value)}
                required
              />
            </div>
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            {message.message && (
              <p role="status" className={`text-sm ${message.status === 'error' ? 'text-destructive' : 'text-emerald-600'}`}>
                {message.message}
              </p>
            )}
            {!isConfigured && <p className="text-sm text-destructive">Supabase is not configured for this site yet.</p>}
            <Button type="submit" className="w-full" disabled={isPending || !loginReady}>
              {isPending ? 'Signing in…' : 'Log in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New here?{' '}
              <button type="button" onClick={() => { setMessage(initialActionState); openAuth('signup'); }} className="font-medium text-primary hover:underline">
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" minLength={3} maxLength={24} autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" autoComplete="name" maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <CountryPicker value={countryCode} onChange={setCountryCode} />
              <input type="hidden" name="countryCode" value={countryCode ?? ''} />
              <input type="hidden" name="countryName" value={selectedCountry?.name ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <div className="flex min-w-0 rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                <span className="flex shrink-0 items-center border-r border-input px-3 text-sm text-muted-foreground">
                  {selectedCountry ? `+${selectedCountry.callingCode}` : '+__'}
                </span>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phoneNumber}
                  onChange={event => setPhoneNumber(event.target.value.replace(/[^\d\s().-]/g, ''))}
                  placeholder="Phone number"
                  className="min-w-0 border-0 shadow-none focus-visible:ring-0"
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={6}
              />
              <PasswordField
                id="passwordConfirmation"
                label="Re-enter password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <p className="text-xs text-muted-foreground">Use at least 6 characters for your password.</p>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="termsAccepted"
                name="termsAccepted"
                checked={termsAccepted}
                onCheckedChange={value => setTermsAccepted(value === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="termsAccepted" className="text-sm font-normal leading-5">
                  I agree to the Terms of Service and Privacy Policy. Demo funds are virtual; Real Wallet payments use supported methods.
                </Label>
                <p className="text-xs leading-5">
                  <Link href="/terms" onClick={closeAuth} className="font-medium text-primary underline underline-offset-2">Read the Terms of Service</Link>
                  <span className="text-muted-foreground"> · </span>
                  <Link href="/privacy" onClick={closeAuth} className="font-medium text-primary underline underline-offset-2">Read the Privacy Policy</Link>
                </p>
              </div>
            </div>
            {message.message && (
              <p role="status" className={`text-sm ${message.status === 'error' ? 'text-destructive' : 'text-emerald-600'}`}>
                {message.message}
              </p>
            )}
            {!isConfigured && <p className="text-sm text-destructive">Supabase is not configured for this site yet.</p>}
            <Button type="submit" className="w-full" disabled={!formReady || isPending}>
              {isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <button type="button" onClick={() => { setMessage(initialActionState); openAuth('login'); }} className="font-medium text-primary hover:underline">
                Log in
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}