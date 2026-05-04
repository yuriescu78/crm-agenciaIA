
-- Add DELETE policies for tasks and clients
DROP POLICY IF EXISTS "Allow anonymous delete on tasks" ON public.tasks;
CREATE POLICY "Allow anonymous delete on tasks" ON public.tasks
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on clients" ON public.clients;
CREATE POLICY "Allow anonymous delete on clients" ON public.clients
  FOR DELETE USING (true);
