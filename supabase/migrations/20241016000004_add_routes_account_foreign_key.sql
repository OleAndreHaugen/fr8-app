-- Add foreign key constraint linking routes.account_id to accounts.id
-- This migration adds the foreign key relationship between routes and accounts tables

-- Add foreign key constraint
alter table public.routes 
add constraint routes_account_id_fkey 
foreign key (account_id) references public.accounts(id) on delete set null;

-- Update the index name to match the new column name
drop index if exists routes_accountid_idx;
create index if not exists routes_account_id_idx on public.routes(account_id);

-- Add comment for documentation
comment on column public.routes.account_id is 'Foreign key reference to accounts table';
