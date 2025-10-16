-- Create fuel_hist table
-- This table stores historical fuel pricing data

-- Create the fuel_hist table
create table if not exists public.fuel_hist (
  id uuid default uuid_generate_v4() primary key,
  product text not null,
  type text not null,
  price numeric(11, 2) not null,
  date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.fuel_hist enable row level security;

-- Create RLS policies
-- Policy: Allow authenticated users to read fuel_hist data
create policy "Allow authenticated users to read fuel_hist data"
  on public.fuel_hist
  for select
  to authenticated
  using (true);

-- Create indexes for better query performance
create index if not exists fuel_hist_product_idx on public.fuel_hist(product);
create index if not exists fuel_hist_type_idx on public.fuel_hist(type);
create index if not exists fuel_hist_date_idx on public.fuel_hist(date);
create index if not exists fuel_hist_product_type_date_idx on public.fuel_hist(product, type, date);

-- Create trigger to call the function for updated_at
create trigger set_fuel_hist_updated_at
  before update on public.fuel_hist
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.fuel_hist is 'Stores historical fuel pricing data';
comment on column public.fuel_hist.product is 'Product name or location';
comment on column public.fuel_hist.type is 'Type of fuel (e.g., VLSFO, MGO)';
comment on column public.fuel_hist.price is 'Historical fuel price with 2 decimal precision';
comment on column public.fuel_hist.date is 'Date in text format (YYYYMMDD)';
