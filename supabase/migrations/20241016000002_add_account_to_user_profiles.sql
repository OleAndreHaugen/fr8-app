-- Add account_id to user_profiles table
-- This allows users to be assigned to accounts

-- Add account_id column to user_profiles table
alter table public.user_profiles 
add column account_id uuid references public.accounts(id) on delete set null;

-- Create index for better query performance
create index if not exists user_profiles_account_id_idx on public.user_profiles(account_id);

-- Update RLS policies to allow users to update their account_id
-- Policy: Users can update their own profile including account_id
drop policy if exists "Users can update their own profile" on public.user_profiles;

create policy "Users can update their own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add comment for documentation
comment on column public.user_profiles.account_id is 'Reference to the account this user belongs to';
