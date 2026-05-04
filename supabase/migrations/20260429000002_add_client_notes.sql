
-- Table: client_notes
CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES public.users(id),
  author_name text, -- Name of the person who wrote the note (fallback)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow anonymous insert on client_notes" ON public.client_notes;
CREATE POLICY "Allow anonymous insert on client_notes" ON public.client_notes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on client_notes" ON public.client_notes;
CREATE POLICY "Allow anonymous select on client_notes" ON public.client_notes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous update on client_notes" ON public.client_notes;
CREATE POLICY "Allow anonymous update on client_notes" ON public.client_notes
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on client_notes" ON public.client_notes;
CREATE POLICY "Allow anonymous delete on client_notes" ON public.client_notes
  FOR DELETE USING (true);
