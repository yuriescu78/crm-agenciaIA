-- Migration to create missing telegram_link_codes table
create table if not exists public.telegram_link_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  code text not null,
  used boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.telegram_link_codes enable row level security;

drop policy if exists "Users can manage their own link codes" on public.telegram_link_codes;
create policy "Users can manage their own link codes"
  on public.telegram_link_codes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
