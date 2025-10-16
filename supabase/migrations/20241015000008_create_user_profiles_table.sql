-- Create user_profiles table
-- This table stores additional user profile information beyond what's in auth.users

-- Create the user_profiles table
create table if not exists public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  title text,
  mobile text,
  country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one profile per user
  unique(user_id)
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;

-- Create RLS policies
-- Policy: Users can view their own profile
create policy "Users can view their own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);

-- Create trigger to call the function for updated_at
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.user_profiles is 'Stores additional user profile information beyond auth.users';
comment on column public.user_profiles.user_id is 'Reference to auth.users.id';
comment on column public.user_profiles.name is 'Full name of the user';
comment on column public.user_profiles.title is 'Job title or position';
comment on column public.user_profiles.mobile is 'Mobile phone number';
comment on column public.user_profiles.country is 'Country of residence';
