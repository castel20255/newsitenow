'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseBrowserConfig } from './types';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(
  config: SupabaseBrowserConfig | null
): SupabaseClient | null {
  if (!config) return null;

  browserClient ??= createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}