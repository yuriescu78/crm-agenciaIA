-- Table: notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, -- 'client', 'task', 'opportunity', 'pipeline'
  related_id uuid,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.notifications enable row level security;

-- Drop existing policies to avoid errors on re-run
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can insert notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Enable realtime for notifications
-- (We use a DO block to avoid error if already added)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Triggers for notifications

-- 1. New client created
create or replace function public.notify_new_client()
returns trigger as $$
begin
  -- Notify active users who have 'on_new_client' enabled AND at least one channel active
  insert into public.notifications (user_id, title, message, type, related_id)
  select id, 'Nuevo Cliente', 'Se ha registrado un nuevo cliente: ' || NEW.first_name || ' ' || coalesce(NEW.last_name, ''), 'client', NEW.id
  from public.users
  where active = true 
    and (notification_preferences->>'on_new_client')::boolean = true
    and (
      (notification_preferences->>'in_app_enabled')::boolean = true or 
      (notification_preferences->>'telegram_enabled')::boolean = true
    );
  
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_client_created on public.clients;
create trigger on_client_created
  after insert on public.clients
  for each row execute function public.notify_new_client();

-- 2. Task assigned
create or replace function public.notify_task_assigned()
returns trigger as $$
declare
  pref_enabled boolean;
begin
  -- Check if assigned user exists and has notifications enabled (any channel)
  if NEW.assigned_to is not null and (TG_OP = 'INSERT' or OLD.assigned_to is distinct from NEW.assigned_to) then
    select (notification_preferences->>'on_task_assigned')::boolean and (
      (notification_preferences->>'in_app_enabled')::boolean or 
      (notification_preferences->>'telegram_enabled')::boolean
    )
    into pref_enabled from public.users where id = NEW.assigned_to;

    if pref_enabled then
      insert into public.notifications (user_id, title, message, type, related_id)
      values (NEW.assigned_to, 'Nueva Tarea Asignada', 'Se te ha asignado la tarea: ' || NEW.title, 'task', NEW.id);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_assigned on public.tasks;
create trigger on_task_assigned
  after insert or update on public.tasks
  for each row execute function public.notify_task_assigned();

-- 3. Change in pipeline (opportunity stage)
create or replace function public.notify_opportunity_stage()
returns trigger as $$
declare
  pref_enabled boolean;
begin
  if OLD.stage is distinct from NEW.stage and NEW.owner_id is not null then
    select (notification_preferences->>'on_opportunity_change')::boolean and (
      (notification_preferences->>'in_app_enabled')::boolean or 
      (notification_preferences->>'telegram_enabled')::boolean
    )
    into pref_enabled from public.users where id = NEW.owner_id;

    if pref_enabled then
      insert into public.notifications (user_id, title, message, type, related_id)
      values (NEW.owner_id, 'Cambio en Pipeline', 'La oportunidad "' || NEW.title || '" ha cambiado a la fase: ' || NEW.stage, 'pipeline', NEW.id);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_opportunity_stage_change on public.opportunities;
create trigger on_opportunity_stage_change
  after update on public.opportunities
  for each row execute function public.notify_opportunity_stage();

-- 4. Comment on opportunity
create or replace function public.notify_opportunity_comment()
returns trigger as $$
declare
  opp_owner uuid;
  opp_title text;
  pref_enabled boolean;
begin
  if NEW.opportunity_id is not null and NEW.type = 'nota' then
    select owner_id, title into opp_owner, opp_title from public.opportunities where id = NEW.opportunity_id;
    
    if opp_owner is not null then
      select (notification_preferences->>'on_comment')::boolean and (
        (notification_preferences->>'in_app_enabled')::boolean or 
        (notification_preferences->>'telegram_enabled')::boolean
      )
      into pref_enabled from public.users where id = opp_owner;

      if pref_enabled then
        insert into public.notifications (user_id, title, message, type, related_id)
        values (opp_owner, 'Nuevo Comentario', 'Se ha añadido un comentario en tu oportunidad: ' || opp_title, 'opportunity', NEW.opportunity_id);
      end if;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_activity_created on public.activities;
create trigger on_activity_created
  after insert on public.activities
  for each row execute function public.notify_opportunity_comment();
-- Fix foreign key constraints for owners and assignees
alter table public.clients drop constraint if exists clients_owner_id_fkey;
alter table public.clients add constraint clients_owner_id_fkey foreign key (owner_id) references public.users(id) on delete set null;

alter table public.opportunities drop constraint if exists opportunities_owner_id_fkey;
alter table public.opportunities add constraint opportunities_owner_id_fkey foreign key (owner_id) references public.users(id) on delete set null;

alter table public.tasks drop constraint if exists tasks_assigned_to_fkey;
alter table public.tasks add constraint tasks_assigned_to_fkey foreign key (assigned_to) references public.users(id) on delete set null;

-- Enable RLS on users table if not already
alter table public.users enable row level security;

-- Add notification preferences to users
alter table public.users add column if not exists notification_preferences jsonb default '{
  "in_app_enabled": true,
  "telegram_enabled": true,
  "on_new_client": true,
  "on_task_assigned": true,
  "on_opportunity_change": true,
  "on_comment": true
}'::jsonb;

-- Add agent config to users
alter table public.users add column if not exists agent_config jsonb default '{
  "model": "groq-llama-3-70b",
  "temperature": 0.7,
  "instructions": "Eres NexusBot, el asistente IA del NexusCRM de la agencia. Tu misión es ser el copiloto comercial del equipo: gestionas clientes, tareas, oportunidades, calendario y notificaciones con máxima eficiencia.\n\n## TUS CAPACIDADES\n- **Clientes:** Buscar, listar, crear y eliminar clientes (nombre, email, empresa, teléfono).\n- **Tareas:** Crear tareas con prioridad (Alta/Media/Baja), listar pendientes, filtrar por hoy o urgentes, y completarlas.\n- **Pipeline:** Listar oportunidades comerciales, crear nuevas y mover entre etapas (Contacto Inicial → Propuesta → Negociación → Ganada/Perdida).\n- **Calendario:** Consultar la agenda de cualquier día y crear eventos que se sincronizan con Google Calendar.\n- **Notificaciones:** Consultar alertas pendientes y marcarlas como leídas.\n- **Resumen Diario:** Generar un dashboard instantáneo con clientes totales, tareas del día, eventos y urgencias.\n\n## REGLAS DE COMPORTAMIENTO\n1. **Acción inmediata:** Si el usuario pide algo que puedes hacer con una herramienta, hazlo SIN preguntar. Solo pide confirmación para eliminar datos.\n2. **Contexto comercial:** Siempre piensa en clave de ventas y seguimiento. Si un cliente no tiene tareas activas, sugiere crear una. Si hay oportunidades estancadas, avisa.\n3. **Formato móvil:** Usa emojis, negritas y listas cortas. El usuario lee desde Telegram en el móvil.\n4. **Idioma:** Siempre en español. Tono profesional pero cercano, como un compañero de equipo senior.\n5. **Proactividad:** Al mostrar resultados, añade insights (ej: \"Tienes 3 tareas urgentes sin resolver\" o \"Este cliente no tiene oportunidades abiertas\")."
}'::jsonb;

-- Ensure updated_at exists
alter table public.users add column if not exists updated_at timestamp with time zone default now();

-- Allow users to view other users' basic profile info
drop policy if exists "Users can view all user profiles" on public.users;
create policy "Users can view all user profiles"
  on public.users for select
  to authenticated
  using (true);

-- Allow users to manage their own telegram link codes
drop policy if exists "Users can manage their own link codes" on public.telegram_link_codes;
create policy "Users can manage their own link codes"
  on public.telegram_link_codes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to view their own telegram links
drop policy if exists "Users can view their own telegram link" on public.telegram_users;
create policy "Users can view their own telegram link"
  on public.telegram_users
  for select
  to authenticated
  using (auth.uid() = user_id);
