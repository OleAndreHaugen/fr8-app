-- Create ffa table
-- This table stores Forward Freight Agreement (FFA) data

-- Create the ffa table
create table if not exists public.ffa (
  id uuid default uuid_generate_v4() primary key,
  contract text not null,
  forward jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.ffa enable row level security;

-- Create indexes for better query performance
create index if not exists ffa_contract_idx on public.ffa(contract);

-- Create trigger to call the function for updated_at
create trigger set_ffa_updated_at
  before update on public.ffa
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.ffa is 'Stores Forward Freight Agreement (FFA) contract data';
comment on column public.ffa.contract is 'Contract identifier or name';
comment on column public.ffa.forward is 'Forward pricing data in JSON format';
