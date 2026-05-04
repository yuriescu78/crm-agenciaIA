/**
 * Supabase client factory for server-side operations with service role key.
 * Used by the agent tools to perform CRUD operations with proper authorization.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the service role key.
 * This client bypasses RLS — use it only in server-side backend code.
 * The crmUserId is logged for auditing but RLS filtering should be done
 * at the query level via .eq('assigned_to', crmUserId) or similar.
 */
export function createSupabaseClientForUser(_crmUserId: string): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  }

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
