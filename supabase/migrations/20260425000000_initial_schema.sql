-- Initial migration for CRM Telegram MVP

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: users (Internal CRM Users)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('admin', 'user')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: clients
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text,
  company text,
  position text,
  email text,
  phone text,
  website text,
  linkedin text,
  province text,
  city text,
  sector text,
  source text,
  status text not null,
  priority text,
  summary text,
  owner_id uuid references public.users(id),
  last_activity_at timestamp with time zone,
  next_action_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: opportunities
create table if not exists public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  description text,
  stage text not null,
  estimated_value numeric,
  probability integer,
  weighted_value numeric,
  expected_close_date date,
  lost_reason text,
  owner_id uuid references public.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: activities
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  type text not null,
  description text,
  origin text not null check (origin in ('web', 'system', 'telegram')),
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

-- Table: tasks
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  title text not null,
  description text,
  status text not null,
  priority text not null,
  due_date timestamp with time zone,
  assigned_to uuid references public.users(id),
  created_by uuid references public.users(id),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: calendar_events
create table if not exists public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  title text not null,
  description text,
  type text,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone not null,
  status text not null,
  owner_id uuid references public.users(id),
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: documents
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  name text not null,
  type text,
  status text,
  version text,
  storage_path text not null,
  notes text,
  uploaded_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: telegram_users
create table if not exists public.telegram_users (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  telegram_user_id text not null unique,
  telegram_username text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Table: telegram_messages
create table if not exists public.telegram_messages (
  id uuid primary key default uuid_generate_v4(),
  telegram_user_id text not null,
  user_id uuid references public.users(id),
  message_text text,
  interpreted_intent jsonb,
  status text not null default 'received',
  response_text text,
  created_at timestamp with time zone default now()
);

-- Table: audit_log
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  actor_type text not null check (actor_type in ('user', 'system', 'telegram_agent')),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamp with time zone default now()
);
