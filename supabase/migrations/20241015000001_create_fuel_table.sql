-- Create fuel table
-- This table stores fuel pricing data including forward pricing

-- Create the fuel table
create table if not exists public.fuel (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  product text not null,
  price numeric(11, 4) not null,
  price_prev numeric(11, 3),
  forward jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add constraint to ensure unique combination of type and product
  unique(type, product)
);

-- Enable Row Level Security
alter table public.fuel enable row level security;

-- Create RLS policies
-- Policy: Allow authenticated users to read fuel data
create policy "Allow authenticated users to read fuel data"
  on public.fuel
  for select
  to authenticated
  using (true);

-- Policy: Allow authenticated users to insert fuel data
create policy "Allow authenticated users to insert fuel data"
  on public.fuel
  for insert
  to authenticated
  with check (true);

-- Policy: Allow authenticated users to update fuel data
create policy "Allow authenticated users to update fuel data"
  on public.fuel
  for update
  to authenticated
  using (true)
  with check (true);

-- Policy: Allow authenticated users to delete fuel data
create policy "Allow authenticated users to delete fuel data"
  on public.fuel
  for delete
  to authenticated
  using (true);

-- Create indexes for better query performance
create index if not exists fuel_type_idx on public.fuel(type);
create index if not exists fuel_product_idx on public.fuel(product);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to call the function
create trigger set_fuel_updated_at
  before update on public.fuel
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.fuel is 'Stores fuel pricing data including forward pricing for VLSFO and MGO';
comment on column public.fuel.type is 'Type of fuel (e.g., VLSFO, MGO)';
comment on column public.fuel.product is 'Specific product name or location';
comment on column public.fuel.price is 'Current fuel price with 4 decimal precision';
comment on column public.fuel.price_prev is 'Previous price at closing with 3 decimal precision';
comment on column public.fuel.forward is 'JSON data containing forward pricing information';

