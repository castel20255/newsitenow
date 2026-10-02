'use client';

import { useEffect, useState } from 'react';
import { LiveRiseFall } from '../components/live-rise-fall';
import { normalizeAppConfig, type RiseFallAppConfig } from '../lib/app-config';

/**
 * Deployed app. Reads optional no-code config from public/app-config.json and
 * applies it after load while rendering the standard app immediately.
 */
export default function RiseFallPage() {
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

  return <LiveRiseFall appConfig={config ?? undefined} />;
}
