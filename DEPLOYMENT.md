# Deployment Guide

## Prerequisites

- Supabase account with a project created
- Vercel account
- Git repository (GitHub, GitLab, or Bitbucket)

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `fr8-portal-production`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### 2. Setup Authentication

1. Go to Authentication → Settings
2. Configure Site URL: `https://your-domain.vercel.app`
3. Add redirect URLs:
   - `https://your-domain.vercel.app/**`
4. Enable email provider
5. (Optional) Disable email confirmation for faster onboarding

### 3. Create Database Tables

Run this SQL in the SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable Row Level Security
alter default privileges revoke execute on functions from public;

-- Example shipments table
create table public.shipments (
  id uuid default uuid_generate_v4() primary key,
  tracking_number text unique not null,
  status text not null check (status in ('pending', 'in_transit', 'delivered', 'cancelled')),
  origin text,
  destination text,
  customer_id uuid references auth.users(id) on delete cascade,
  carrier_id uuid,
  estimated_delivery timestamp with time zone,
  actual_delivery timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.shipments enable row level security;

-- RLS Policies
create policy "Users can view their own shipments"
  on public.shipments for select
  using (auth.uid() = customer_id);

create policy "Users can create their own shipments"
  on public.shipments for insert
  with check (auth.uid() = customer_id);

create policy "Users can update their own shipments"
  on public.shipments for update
  using (auth.uid() = customer_id);

-- Create indexes
create index shipments_customer_id_idx on public.shipments(customer_id);
create index shipments_tracking_number_idx on public.shipments(tracking_number);
create index shipments_status_idx on public.shipments(status);

-- Example customers table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.customers enable row level security;

create policy "Users can view their own customer data"
  on public.customers for select
  using (auth.uid() = user_id);
```

### 4. Setup Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy fetch-external-data
supabase functions deploy sync-shipments

# Set secrets for functions
supabase secrets set CARRIER_API_KEY=your-api-key
supabase secrets set TRACKING_API_KEY=your-api-key
```

### 5. Schedule Background Jobs

Enable pg_cron:
1. Go to Database → Extensions
2. Search for "pg_cron" and enable it

Run in SQL Editor:

```sql
-- Schedule fetch-external-data to run every hour
select cron.schedule(
  'fetch-external-data-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/fetch-external-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Schedule sync-shipments to run every 15 minutes
select cron.schedule(
  'sync-shipments-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/sync-shipments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- View all scheduled jobs
select * from cron.job;
```

## Vercel Deployment

### 1. Push to Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CARRIER_API_KEY=your-carrier-api-key
TRACKING_API_KEY=your-tracking-api-key
```

### 4. Deploy

Click "Deploy" - Vercel will:
- Build your application
- Run type checking and linting
- Deploy to production

### 5. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Post-Deployment

### 1. Update Supabase Auth Settings

Update Site URL and redirect URLs with your production domain.

### 2. Generate Production Types

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
git add types/database.ts
git commit -m "Update database types"
git push
```

### 3. Test Authentication

1. Visit your production URL
2. Sign up for a new account
3. Verify email works (if enabled)
4. Test login/logout

### 4. Monitor

- **Vercel Dashboard**: Monitor deployments and performance
- **Supabase Dashboard**: Monitor database usage and API calls
- **Edge Functions Logs**: Check function execution in Supabase

## Continuous Deployment

Every push to `main` branch will:
1. Trigger a new Vercel deployment
2. Run build and type checks
3. Deploy if successful

## Rollback

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Monitoring & Analytics

### Add Vercel Analytics

```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Add Error Tracking

Consider adding [Sentry](https://sentry.io) for error tracking:

```bash
npm install @sentry/nextjs
```

## Scaling Considerations

### Database

- Enable Connection Pooling in Supabase
- Add database indexes for frequently queried fields
- Use Supabase caching

### Edge Functions

- Monitor execution time
- Optimize API calls
- Use background tasks for long operations

### Frontend

- Enable Vercel Edge caching
- Optimize images
- Use ISR for static content

## Security Checklist

- [ ] Row Level Security enabled on all tables
- [ ] Environment variables set in Vercel
- [ ] Service role key never exposed to frontend
- [ ] API rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use parameterized queries)

## Backup Strategy

### Database Backups

Supabase Pro includes:
- Daily backups (7 days retention)
- Point-in-time recovery

### Manual Backup

```bash
# Export database
supabase db dump -f backup.sql

# Restore
supabase db reset
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

---

Your FR8 Portal is now deployed and production-ready! 🚀

