
-- RLS Policies for Clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert on clients" ON public.clients;
CREATE POLICY "Allow anonymous insert on clients" ON public.clients
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on clients" ON public.clients;
CREATE POLICY "Allow anonymous select on clients" ON public.clients
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous update on clients" ON public.clients;
CREATE POLICY "Allow anonymous update on clients" ON public.clients
  FOR UPDATE USING (true);

-- RLS Policies for Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert on tasks" ON public.tasks;
CREATE POLICY "Allow anonymous insert on tasks" ON public.tasks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on tasks" ON public.tasks;
CREATE POLICY "Allow anonymous select on tasks" ON public.tasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous update on tasks" ON public.tasks;
CREATE POLICY "Allow anonymous update on tasks" ON public.tasks
  FOR UPDATE USING (true);
