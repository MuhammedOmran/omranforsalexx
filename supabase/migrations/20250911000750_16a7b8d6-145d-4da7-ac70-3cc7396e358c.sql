-- Ensure extension for UUID generation
create extension if not exists pgcrypto;

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  phone text,
  location text,
  company text,
  website text,
  role text default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies: users can manage only their own profile
create policy if not exists "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Trigger for updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

-- Trigger to create profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public 
as $$
begin
  insert into public.profiles (user_id, full_name, username, is_active)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username', true)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (user_id, full_name, username, is_active)
select u.id, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'username', true
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

-- Helpful index
create index if not exists idx_profiles_user_id on public.profiles(user_id);
