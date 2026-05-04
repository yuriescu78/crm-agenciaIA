/**
 * Conversation Memory Management
 * Stores and retrieves conversation history from Supabase's telegram_messages table.
 * Used to provide context to the LLM for multi-turn conversations.
 */

import { createClient } from '@supabase/supabase-js';
import type { ModelMessage } from 'ai';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Load recent conversation history for a Telegram user.
 * Returns CoreMessage[] format compatible with the AI SDK.
 */
export async function loadConversationHistory(
  telegramId: number,
  limit: number = 10
): Promise<ModelMessage[]> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('telegram_messages')
    .select('role, content')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('Error loading conversation history:', error?.message);
    return [];
  }

  // Reverse to get chronological order (oldest first)
  return data
    .reverse()
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
}

/**
 * Save a single message to the conversation history.
 */
export async function saveMessage(
  telegramId: number,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('telegram_messages')
    .insert({
      telegram_id: telegramId,
      role,
      content,
    });

  if (error) {
    console.error('Error saving message:', error.message);
  }
}
