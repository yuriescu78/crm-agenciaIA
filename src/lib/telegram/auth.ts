/**
 * Telegram User Authorization
 * Verifies that a Telegram user is linked to a CRM user.
 * Uses the telegram_users table for lookup.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AuthResult {
  crmUserId: string;
  telegramUserId: string;
}

/**
 * Check if a Telegram user ID is authorized in the CRM.
 * Returns the linked CRM user ID if authorized, null otherwise.
 */
export async function authorizeTelegramUser(
  telegramId: number
): Promise<AuthResult | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('telegram_users')
    .select('user_id, telegram_user_id')
    .eq('telegram_user_id', telegramId.toString())
    .eq('active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    crmUserId: data.user_id,
    telegramUserId: data.telegram_user_id,
  };
}

/**
 * Link a Telegram user to a CRM user using a one-time code.
 * The code must exist in the telegram_link_codes table and not be expired.
 */
export async function linkTelegramUser(
  telegramId: number,
  linkCode: string
): Promise<{ success: boolean; error?: string }> {
  const db = getSupabaseAdmin();

  // 1. Find the link code
  const { data: codeData, error: codeError } = await db
    .from('telegram_link_codes')
    .select('id, user_id, expires_at, used')
    .eq('code', linkCode)
    .single();

  if (codeError || !codeData) {
    return { success: false, error: 'Código no válido o no encontrado.' };
  }

  if (codeData.used) {
    return { success: false, error: 'Este código ya ha sido utilizado.' };
  }

  if (new Date(codeData.expires_at) < new Date()) {
    return { success: false, error: 'Este código ha expirado. Genera uno nuevo desde la web.' };
  }

  // 2. Create the telegram_users link
  const { error: linkError } = await db
    .from('telegram_users')
    .upsert({
      telegram_user_id: telegramId.toString(),
      user_id: codeData.user_id,
      active: true,
    }, {
      onConflict: 'telegram_user_id',
    });

  if (linkError) {
    return { success: false, error: `Error al vincular: ${linkError.message}` };
  }

  // 3. Mark code as used
  await db
    .from('telegram_link_codes')
    .update({ used: true })
    .eq('id', codeData.id);

  return { success: true };
}
