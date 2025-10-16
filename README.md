# FR8 Portal - Modern Freight Management System

A production-ready freight management portal built with Next.js 14, React, Supabase, and TypeScript. Deployed on Vercel with Edge Functions for background jobs.

## Features

- 🔐 **Authentication** - Email/password authentication with Supabase Auth
- 📦 **Shipment Management** - Create, track, and manage shipments
- 🚚 **Carrier Integration** - Manage carrier relationships and integrations
- 👥 **Customer Management** - Handle customer relationships
- 📊 **Dashboard** - Real-time overview of operations
- 🔄 **Background Jobs** - Supabase Edge Functions for external API integration
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Vercel
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: SWR

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account for deployment ([vercel.com](https://vercel.com))

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd fr8
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup Supabase**

Create a new Supabase project at [supabase.com](https://supabase.com)

4. **Configure environment variables**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project settings → API.

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
fr8/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── shipments/
│   │       ├── tracking/
│   │       ├── customers/
│   │       ├── carriers/
│   │       └── invoices/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── layouts/                  # Layout components
│
├── lib/                          # Utilities
│   ├── supabase/                 # Supabase clients
│   ├── validations/              # Zod schemas
│   └── utils.ts
│
├── types/                        # TypeScript types
│   └── database.ts
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts
│
├── supabase/                     # Supabase configuration
│   ├── functions/                # Edge Functions
│   │   ├── fetch-external-data/
│   │   └── sync-shipments/
│   └── config.toml
│
└── public/                       # Static assets
```

## Database Setup

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create your tables (examples provided below)

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Create a new migration
supabase migration new create_tables

# Apply migrations
supabase db push
```

### Example Database Schema

```sql
-- Enable Row Level Security
alter table if exists public.shipments enable row level security;

-- Create shipments table (example)
create table public.shipments (
  id uuid default gen_random_uuid() primary key,
  tracking_number text unique not null,
  status text not null,
  origin text,
  destination text,
  customer_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
create policy "Users can view their own shipments"
  on shipments for select
  using (auth.uid() = customer_id);

create policy "Users can create their own shipments"
  on shipments for insert
  with check (auth.uid() = customer_id);
```

### Generate TypeScript Types

After creating your tables, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## Supabase Edge Functions

### Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy

# Or deploy a specific function
supabase functions deploy fetch-external-data
```

### Schedule Functions with pg_cron

Enable pg_cron extension in Supabase:

1. Go to Database → Extensions
2. Enable `pg_cron`

Then create a scheduled job:

```sql
-- Run every hour
select cron.schedule(
  'fetch-external-data',
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

-- View scheduled jobs
select * from cron.job;

-- Unschedule a job
select cron.unschedule('fetch-external-data');
```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional)

```bash
npm install -g vercel
```

2. **Connect to Vercel**

```bash
vercel
```

Follow the prompts to link your project.

3. **Add Environment Variables**

In your Vercel project settings, add all environment variables from `.env.local`.

4. **Deploy**

```bash
vercel --prod
```

Or push to your main branch if you've connected your Git repository to Vercel.

### Automatic Deployments

Connect your GitHub repository to Vercel for automatic deployments:

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Add environment variables
4. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for Edge Functions) | Yes |
| `CARRIER_API_KEY` | External carrier API key | Optional |
| `TRACKING_API_KEY` | External tracking API key | Optional |
| `CRON_SECRET` | Secret for Vercel Cron jobs | Optional |

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Production Considerations

### Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Environment variables for sensitive data
- ✅ Input validation with Zod
- ✅ Security headers configured
- ✅ HTTPS enforced in production

### Performance

- ✅ Server-side rendering with Next.js 14
- ✅ Image optimization
- ✅ Code splitting
- ✅ Edge Functions for background jobs
- ✅ Database indexing

### Monitoring

Consider adding:
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry](https://sentry.io) for error tracking
- Supabase Dashboard for database monitoring

## Adding New Features

### Create a New Page

1. Create a new file in `app/(dashboard)/dashboard/[feature]/page.tsx`
2. Add the route to navigation in `components/layouts/sidebar.tsx`

### Create a Database Table

1. Create migration: `supabase migration new add_feature_table`
2. Write SQL in the migration file
3. Apply: `supabase db push`
4. Generate types: `npx supabase gen types typescript --project-id your-project-id > types/database.ts`

### Add an Edge Function

1. Create directory: `supabase/functions/your-function/`
2. Create `index.ts` with your function code
3. Deploy: `supabase functions deploy your-function`

## Support

For issues and questions:
- Check [Supabase Documentation](https://supabase.com/docs)
- Check [Next.js Documentation](https://nextjs.org/docs)
- Review [Vercel Documentation](https://vercel.com/docs)

## License

This project is private and proprietary to FR8.

---

Built with ❤️ by the FR8 team

