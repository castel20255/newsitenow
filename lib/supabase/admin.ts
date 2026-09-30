import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey, isServerConfigured } = getSupabaseConfig();
  if (!isServerConfigured || !url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}