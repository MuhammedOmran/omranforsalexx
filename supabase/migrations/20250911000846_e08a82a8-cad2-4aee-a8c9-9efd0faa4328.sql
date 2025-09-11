-- Ensure columns exist on profiles and policies allow self-update
create extension if not exists pgcrypto;

-- Add missing columns on profiles table
alter table public.profiles
  add column if not exists id uuid primary key default gen_random_uuid(),
  add column if not exists user_id uuid unique references auth.users(id) on delete cascade,
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists company text,
  add column if not exists website text,
  add column if not exists role text default 'user',
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies with duplicate protection
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Trigger for updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

-- Backfill profiles for existing users missing a row
insert into public.profiles (user_id, is_active)
select u.id, true
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

-- Helpful index
create index if not exists idx_profiles_user_id on public.profiles(user_id);
