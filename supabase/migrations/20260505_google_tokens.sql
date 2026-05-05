-- Migration to store Google OAuth tokens for centralized agency account
CREATE TABLE IF NOT EXISTS google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email text UNIQUE NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read/write for authenticated users" ON google_tokens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
