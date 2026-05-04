-- Migration: Add tables for LLM bot conversation memory and Telegram linking
-- Run this in your Supabase SQL editor

-- ============================================================
-- telegram_messages: Stores conversation history for LLM context
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast history lookups
CREATE INDEX IF NOT EXISTS idx_telegram_messages_telegram_id 
  ON telegram_messages (telegram_id, created_at DESC);

-- Enable RLS
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything (bot backend)
CREATE POLICY "Service role full access on telegram_messages"
  ON telegram_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- telegram_link_codes: One-time codes to link Telegram users to CRM
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_link_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_code 
  ON telegram_link_codes (code) WHERE used = false;

-- Enable RLS
ALTER TABLE telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything
CREATE POLICY "Service role full access on telegram_link_codes"
  ON telegram_link_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Ensure telegram_users table exists (may already exist)
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything
CREATE POLICY "Service role full access on telegram_users"
  ON telegram_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
