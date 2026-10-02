import 'server-only';

import type { SupabaseBrowserConfig } from './types';

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function getSupabaseConfig() {
  const browserConfig = getSupabaseBrowserConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    url: browserConfig?.url,
    publishableKey: browserConfig?.publishableKey,
    serviceRoleKey,
    isBrowserConfigured: Boolean(browserConfig),
    isServerConfigured: Boolean(browserConfig && serviceRoleKey),
  };
}