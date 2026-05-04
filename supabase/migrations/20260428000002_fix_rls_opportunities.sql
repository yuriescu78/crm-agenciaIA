
-- RLS Policies for Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on opportunities" ON public.opportunities;
CREATE POLICY "Allow anonymous insert on opportunities" ON public.opportunities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous select on opportunities" ON public.opportunities;
CREATE POLICY "Allow anonymous select on opportunities" ON public.opportunities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous update on opportunities" ON public.opportunities;
CREATE POLICY "Allow anonymous update on opportunities" ON public.opportunities FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete on opportunities" ON public.opportunities;
CREATE POLICY "Allow anonymous delete on opportunities" ON public.opportunities FOR DELETE USING (true);

-- RLS Policies for Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on activities" ON public.activities;
CREATE POLICY "Allow anonymous insert on activities" ON public.activities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous select on activities" ON public.activities;
CREATE POLICY "Allow anonymous select on activities" ON public.activities FOR SELECT USING (true);

-- RLS Policies for Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on calendar_events" ON public.calendar_events;
CREATE POLICY "Allow anonymous insert on calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous select on calendar_events" ON public.calendar_events;
CREATE POLICY "Allow anonymous select on calendar_events" ON public.calendar_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous update on calendar_events" ON public.calendar_events;
CREATE POLICY "Allow anonymous update on calendar_events" ON public.calendar_events FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete on calendar_events" ON public.calendar_events;
CREATE POLICY "Allow anonymous delete on calendar_events" ON public.calendar_events FOR DELETE USING (true);

-- RLS Policies for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous all on documents" ON public.documents;
CREATE POLICY "Allow anonymous all on documents" ON public.documents FOR ALL USING (true);

-- RLS Policies for Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on audit_log" ON public.audit_log;
CREATE POLICY "Allow anonymous insert on audit_log" ON public.audit_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous select on audit_log" ON public.audit_log;
CREATE POLICY "Allow anonymous select on audit_log" ON public.audit_log FOR SELECT USING (true);

-- RLS Policies for Telegram Messages/Users
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all on telegram_users" ON public.telegram_users FOR ALL USING (true);
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all on telegram_messages" ON public.telegram_messages FOR ALL USING (true);
