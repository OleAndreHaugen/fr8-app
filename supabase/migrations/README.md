# Database Migrations

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from each migration file in order:
   - **First:** `20241015000000_enable_extensions.sql` (REQUIRED - enables UUID support)
   - **Second:** `20241015000001_create_fuel_table.sql`
   - **Third:** `20241015000003_create_fuel_codes_table.sql`
   - **Fourth:** `20241015000004_seed_fuel_codes_sample_data.sql` (optional)
   - **Fifth:** `20241015000005_create_ffa_table.sql`
   - **Sixth:** `20241015000006_seed_ffa_sample_data.sql` (optional)
   - **Seventh:** `20241015000007_create_fuel_hist_table.sql`
4. Click **Run** (or Ctrl+Enter) after pasting each one

### Option 2: Using Supabase CLI (Recommended for Production)

```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run all pending migrations
supabase db push

# Or run a specific migration
supabase db execute --file supabase/migrations/20241015000001_create_fr8_fuel_table.sql
```

### Option 3: Copy SQL Directly (Quick Start)

Simply copy and paste this into your Supabase SQL Editor:

```sql
-- Run the contents of 20241015000001_create_fr8_fuel_table.sql
-- Then run the contents of 20241015000002_seed_fr8_fuel_sample_data.sql
```

## Migrations Included

### 0. `20241015000000_enable_extensions.sql` ⚠️ RUN THIS FIRST
Enables required PostgreSQL extensions:
- ✅ uuid-ossp (for UUID generation)
- ✅ pgcrypto (for cryptographic functions)

### 1. `20241015000001_create_fuel_table.sql`
Creates the `fr8_fuel` table with:
- ✅ UUID primary key
- ✅ Type and product fields (text)
- ✅ Price fields (decimal with proper precision)
- ✅ Forward pricing (JSONB)
- ✅ Timestamps (created_at, updated_at)
- ✅ Row Level Security (RLS) enabled
- ✅ RLS policies for authenticated users
- ✅ Indexes for performance
- ✅ Auto-update trigger for updated_at
- ✅ Unique constraint on (type, product)

### 2. `20241015000002_seed_fr8_fuel_sample_data.sql`
Adds sample data:
- VLSFO prices (Antwerp, Fujairah, Gibraltar, Rotterdam, Singapore)
- MGO prices (Antwerp, Fujairah, Gibraltar, Rotterdam, Singapore)
- Forward pricing data in JSON format

### 3. `20241015000003_create_fuel_codes_table.sql`
Creates the `fuel_codes` lookup table with:
- ✅ UUID primary key
- ✅ Code field (text) - Fuel code identifier
- ✅ Port field (text) - Port/location name
- ✅ Timestamps (created_at, updated_at)
- ✅ Row Level Security (RLS) enabled
- ✅ RLS policies for authenticated users
- ✅ Indexes for performance
- ✅ Auto-update trigger for updated_at
- ✅ Unique constraint on code

### 4. `20241015000004_seed_fuel_codes_sample_data.sql`
Adds sample fuel codes:
- ANT (Antwerp), FUJ (Fujairah), GIB (Gibraltar)
- ROT (Rotterdam), SIN (Singapore), HOU (Houston)
- LOS (Los Angeles), HAM (Hamburg), DUB (Dubai), HKG (Hong Kong)

### 5. `20241015000005_create_ffa_table.sql`
Creates the `ffa` table with:
- ✅ UUID primary key
- ✅ Contract field (text) - Contract identifier
- ✅ Forward field (jsonb) - Forward pricing data
- ✅ Timestamps (created_at, updated_at)
- ✅ Row Level Security (RLS) enabled
- ✅ Indexes for performance
- ✅ Auto-update trigger for updated_at

### 6. `20241015000006_seed_ffa_sample_data.sql`
Adds sample FFA contracts:
- C3_TC, C5_TC, C7_TC, C9_TC, C11_TC, C14_TC
- Forward pricing data in JSON format with quarterly prices

### 7. `20241015000007_create_fuel_hist_table.sql`
Creates the `fuel_hist` table with:
- ✅ UUID primary key
- ✅ Product field (text) - Product name or location
- ✅ Type field (text) - Type of fuel (VLSFO, MGO)
- ✅ Price field (decimal 11,2) - Historical fuel price
- ✅ Date field (text) - Date in YYYYMMDD format
- ✅ Timestamps (created_at, updated_at)
- ✅ Row Level Security (RLS) enabled
- ✅ RLS policies for authenticated users
- ✅ Indexes for performance (including composite index)
- ✅ Auto-update trigger for updated_at

## After Running Migrations

### Verify the Tables

```sql
-- Check if tables exist
select * from public.fuel;
select * from public.fuel_codes;
select * from public.ffa;
select * from public.fuel_hist;

-- Check RLS policies
select * from pg_policies where tablename in ('fuel', 'fuel_codes', 'ffa', 'fuel_hist');

-- Check indexes
select * from pg_indexes where tablename in ('fuel', 'fuel_codes', 'ffa', 'fuel_hist');
```

### Update TypeScript Types (Already Done)

The `types/database.ts` file has been updated with the new table structure.

### Use in Your Application

```typescript
import { createClient } from '@/lib/supabase/server';

// Fetch fuel data
const supabase = await createClient();
const { data: fuelData, error } = await supabase
  .from('fr8_fuel')
  .select('*')
  .eq('type', 'VLSFO');

// Fetch fuel codes
const { data: codes, error: codesError } = await supabase
  .from('fuel_codes')
  .select('*')
  .order('code');

// Fetch FFA data
const { data: ffaData, error: ffaError } = await supabase
  .from('ffa')
  .select('*')
  .order('contract');

// Fetch fuel history data
const { data: fuelHistData, error: fuelHistError } = await supabase
  .from('fuel_hist')
  .select('*')
  .eq('product', 'Rotterdam')
  .eq('type', 'VLSFO')
  .order('date', { ascending: false });
```

## Rolling Back

If you need to rollback:

```sql
-- Drop the tables
drop table if exists public.fuel cascade;
drop table if exists public.fuel_codes cascade;
drop table if exists public.ffa cascade;
drop table if exists public.fuel_hist cascade;

-- Drop the function (only if no other tables use it)
drop function if exists public.handle_updated_at() cascade;
```

