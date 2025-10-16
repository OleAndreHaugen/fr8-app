-- Create fuel_codes table
-- This table stores fuel codes and their associated ports/locations

-- Create the fuel_codes table
create table if not exists public.fuel_codes (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  port text not null,  
  
  -- Add constraint to ensure unique codes
  unique(code)
);

-- Enable Row Level Security
alter table public.fuel_codes enable row level security;

-- Create RLS policies
-- Policy: Allow authenticated users to read fuel codes
create policy "Allow authenticated users to read fuel codes"
  on public.fuel_codes
  for select
  to authenticated
  using (true);

-- Create indexes for better query performance
create index if not exists fuel_codes_code_idx on public.fuel_codes(code);
create index if not exists fuel_codes_port_idx on public.fuel_codes(port);

-- Add comments for documentation
comment on table public.fuel_codes is 'Stores fuel codes and their associated ports/locations';
comment on column public.fuel_codes.code is 'Fuel code identifier';
comment on column public.fuel_codes.port is 'Port or location name associated with the fuel code';

