'use client';

import { useEffect, useState } from 'react';
import { LiveRiseFall } from '../components/live-rise-fall';
import { normalizeAppConfig, type RiseFallAppConfig } from '../lib/app-config';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { CryptoBinaryLanding } from '@/components/crypto-binary-landing';

/**
 * Deployed app. Reads optional no-code config from public/app-config.json and
 * applies it after load while rendering the standard app immediately.
 */
export default function RiseFallPage() {
  const { authState } = useSiteAuth();
  const [config, setConfig] = useState<RiseFallAppConfig | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/app-config.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setConfig(data ? normalizeAppConfig(data) : null);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === 'authenticated') {
    return <LiveRiseFall appConfig={config ?? undefined} />;
  }

  return <CryptoBinaryLanding />;
}
