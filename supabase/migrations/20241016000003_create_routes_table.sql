-- Create routes table for My Calculations functionality
-- This table stores route calculation data for authenticated users

-- Create the routes table
create table if not exists public.routes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  account_id text,
  customer text,
  route text,
  port_load text,
  port_disch text,
  terms_load text,
  terms_disch text,
  rate_load integer,
  rate_disch integer,
  difference integer,
  duration decimal,
  total_vlsfo decimal,
  total_lsmgo decimal,
  total_pda integer,
  total_misc integer,
  commission decimal,
  commission_adress decimal,
  intake integer,
  intake_tolerance text,
  rate decimal,
  fuel text,
  terms text,
  diff_jan integer,
  diff_feb integer,
  diff_mar integer,
  diff_apr integer,
  diff_may integer,
  diff_jun integer,
  diff_jul integer,
  diff_aug integer,
  diff_sep integer,
  diff_oct integer,
  diff_nov integer,
  diff_dec integer,
  sys_name text,
  rates jsonb,
  savedBy text not null,
  savedAt timestamp with time zone default timezone('utc'::text, now()) not null,
  active boolean default true,
  stemsize integer,
  diff_jan_unit text,
  diff_feb_unit text,
  diff_mar_unit text,
  diff_apr_unit text,
  diff_may_unit text,
  diff_jun_unit text,
  diff_jul_unit text,
  diff_aug_unit text,
  diff_sep_unit text,
  diff_oct_unit text,
  diff_nov_unit text,
  diff_dec_unit text,
  fobid text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.routes enable row level security;

-- Create RLS policies for CRUD operations
-- Policy: Authenticated users can read all routes
create policy "Allow authenticated users to read routes"
  on public.routes
  for select
  to authenticated
  using (true);

-- Policy: Authenticated users can insert routes
create policy "Allow authenticated users to insert routes"
  on public.routes
  for insert
  to authenticated
  with check (true);

-- Policy: Authenticated users can update routes
create policy "Allow authenticated users to update routes"
  on public.routes
  for update
  to authenticated
  using (true)
  with check (true);

-- Policy: Authenticated users can delete routes
create policy "Allow authenticated users to delete routes"
  on public.routes
  for delete
  to authenticated
  using (true);

-- Policy: Service role can manage all routes
create policy "Allow service role to manage all routes"
  on public.routes
  for all
  to service_role
  using (true)
  with check (true);

-- Create indexes for better query performance
create index if not exists routes_account_id_idx on public.routes(account_id);
create index if not exists routes_customer_idx on public.routes(customer);
create index if not exists routes_savedBy_idx on public.routes(savedBy);
create index if not exists routes_active_idx on public.routes(active);
create index if not exists routes_savedAt_idx on public.routes(savedAt);
create index if not exists routes_created_at_idx on public.routes(created_at);

-- Create trigger to call the function for updated_at
create trigger set_routes_updated_at
  before update on public.routes
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.routes is 'Stores route calculation data for My Calculations functionality';
comment on column public.routes.name is 'Route calculation name';
comment on column public.routes.account_id is 'Account ID associated with the route';
comment on column public.routes.customer is 'Customer name';
comment on column public.routes.route is 'Route description';
comment on column public.routes.port_load is 'Loading port';
comment on column public.routes.port_disch is 'Discharge port';
comment on column public.routes.terms_load is 'Loading terms';
comment on column public.routes.terms_disch is 'Discharge terms';
comment on column public.routes.rate_load is 'Loading rate';
comment on column public.routes.rate_disch is 'Discharge rate';
comment on column public.routes.difference is 'Rate difference';
comment on column public.routes.duration is 'Route duration';
comment on column public.routes.total_vlsfo is 'Total VLSFO fuel cost';
comment on column public.routes.total_lsmgo is 'Total LSMGO fuel cost';
comment on column public.routes.total_pda is 'Total PDA cost';
comment on column public.routes.total_misc is 'Total miscellaneous costs';
comment on column public.routes.commission is 'Commission amount';
comment on column public.routes.commission_adress is 'Commission address';
comment on column public.routes.intake is 'Intake amount';
comment on column public.routes.intake_tolerance is 'Intake tolerance';
comment on column public.routes.rate is 'Base rate';
comment on column public.routes.fuel is 'Fuel type';
comment on column public.routes.terms is 'General terms';
comment on column public.routes.diff_jan is 'January difference';
comment on column public.routes.diff_feb is 'February difference';
comment on column public.routes.diff_mar is 'March difference';
comment on column public.routes.diff_apr is 'April difference';
comment on column public.routes.diff_may is 'May difference';
comment on column public.routes.diff_jun is 'June difference';
comment on column public.routes.diff_jul is 'July difference';
comment on column public.routes.diff_aug is 'August difference';
comment on column public.routes.diff_sep is 'September difference';
comment on column public.routes.diff_oct is 'October difference';
comment on column public.routes.diff_nov is 'November difference';
comment on column public.routes.diff_dec is 'December difference';
comment on column public.routes.sys_name is 'System name';
comment on column public.routes.rates is 'JSON object containing rate data';
comment on column public.routes.savedBy is 'User who saved the route calculation';
comment on column public.routes.savedAt is 'Timestamp when the route was saved';
comment on column public.routes.active is 'Whether the route calculation is active';
comment on column public.routes.stemsize is 'Stem size';
comment on column public.routes.diff_jan_unit is 'January difference unit';
comment on column public.routes.diff_feb_unit is 'February difference unit';
comment on column public.routes.diff_mar_unit is 'March difference unit';
comment on column public.routes.diff_apr_unit is 'April difference unit';
comment on column public.routes.diff_may_unit is 'May difference unit';
comment on column public.routes.diff_jun_unit is 'June difference unit';
comment on column public.routes.diff_jul_unit is 'July difference unit';
comment on column public.routes.diff_aug_unit is 'August difference unit';
comment on column public.routes.diff_sep_unit is 'September difference unit';
comment on column public.routes.diff_oct_unit is 'October difference unit';
comment on column public.routes.diff_nov_unit is 'November difference unit';
comment on column public.routes.diff_dec_unit is 'December difference unit';
comment on column public.routes.fobid is 'FOB ID';
