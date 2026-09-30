'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const { url, anonKey, isBrowserConfigured } = getSupabaseConfig();
  if (!isBrowserConfigured || !url || !anonKey) return null;

  browserClient ??= createBrowserClient(url, anonKey);
  return browserClient;
}