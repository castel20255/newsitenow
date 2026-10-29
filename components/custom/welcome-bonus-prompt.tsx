'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Gift } from 'lucide-react';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function WelcomeBonusPrompt() {
  const { authState, user } = useSiteAuth();
  const router = useRouter();
  const [claimed, setClaimed] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authState !== 'authenticated' || !user) return;

    const userId = user.id;
    let cancelled = false;
    setLoadedUserId(null);
    fetch('/api/wallet/welcome-bonus', { cache: 'no-store' })
      .then(async response => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || typeof data !== 'object' || data === null) throw new Error('Could not check bonus status.');
        if (!cancelled) {
          setClaimed(Boolean((data as { claimed?: unknown }).claimed));
          setLoadedUserId(userId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClaimed(false);
          setLoadedUserId(userId);
        }
      });

    return () => { cancelled = true; };
  }, [authState, user?.id]);

  useEffect(() => {
    if (authState !== 'authenticated') {
      setDismissed(false);
      setLoadedUserId(null);
    }
  }, [authState]);

  if (authState !== 'authenticated' || claimed || dismissed || loadedUserId !== user?.id) return null;

  return (
    <Dialog open onOpenChange={open => { if (!open) setDismissed(true); }}>
      <DialogContent
        overlayClassName="z-[300] bg-black/75 backdrop-blur-md"
        className="z-[301] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto overscroll-contain border-0 bg-transparent p-0 shadow-none sm:rounded-none"
      >
        <section className="welcome-bonus-card relative w-full overflow-hidden p-5 text-white shadow-[0_0_70px_rgba(35,240,173,0.24)] sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center border border-emerald-200/50 bg-emerald-300/15 text-emerald-200">
            <Gift className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">A welcome gift for you</p>
          <DialogTitle className="mt-2 text-4xl font-semibold tabular-nums sm:text-5xl">$20 <span className="text-2xl text-emerald-200">USD</span></DialogTitle>
          <DialogDescription className="mt-3 max-w-sm text-sm leading-6 text-white/75">Make your first deposit of at least $10 through this offer to unlock a one-time bonus. The reward is withdrawable and tradable.</DialogDescription>
          <button type="button" onClick={() => { setDismissed(true); router.push('/wallet?welcomeBonus=1'); }} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-200">
            Deposit now <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-center text-xs text-white/55">Credited once after your qualifying payment is confirmed.</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}