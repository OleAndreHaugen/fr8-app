-- Create accounts table
-- This table stores account/company information for user assignment

-- Create the accounts table
create table if not exists public.accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  status text not null,
  emaildomain text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add constraints for valid values
  constraint valid_type check (type in ('Owner', 'Broker', 'Admin', 'Charterer')),
  constraint valid_status check (status in ('Validated', 'Blocked', 'Not Validated'))
);

-- Enable Row Level Security
alter table public.accounts enable row level security;

-- Create RLS policies
-- Policy: Authenticated users can read all accounts (for dialog dropdown)
create policy "Allow authenticated users to read accounts"
  on public.accounts
  for select
  to authenticated
  using (true);

-- Policy: Users can insert accounts (for creating new accounts)
create policy "Allow authenticated users to insert accounts"
  on public.accounts
  for insert
  to authenticated
  with check (true);

-- Policy: Users can update accounts they created (owner check via user_profiles)
create policy "Allow users to update their own accounts"
  on public.accounts
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles 
      where user_profiles.account_id = accounts.id 
      and user_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles 
      where user_profiles.account_id = accounts.id 
      and user_profiles.user_id = auth.uid()
    )
  );

-- Policy: Service role can manage all accounts
create policy "Allow service role to manage all accounts"
  on public.accounts
  for all
  to service_role
  using (true)
  with check (true);

-- Create indexes for better query performance
create index if not exists accounts_email_domain_idx on public.accounts(emaildomain);
create index if not exists accounts_status_idx on public.accounts(status);
create index if not exists accounts_type_idx on public.accounts(type);

-- Create trigger to call the function for updated_at
create trigger set_accounts_updated_at
  before update on public.accounts
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.accounts is 'Stores account/company information for user assignment';
comment on column public.accounts.name is 'Account/company name';
comment on column public.accounts.type is 'Account type: Owner, Broker, Admin, or Charterer';
comment on column public.accounts.status is 'Account status: Validated, Blocked, or Not Validated';
comment on column public.accounts.emaildomain is 'Email domain for matching user emails (e.g., company.com)';
