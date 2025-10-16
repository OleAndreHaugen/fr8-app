# FR8 Portal - Quick Start

## ⚡ Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from: [supabase.com](https://supabase.com) → Your Project → Settings → API

### 3. Run Development Server
```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📋 Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

## 🗄️ Supabase Commands

| Command | Description |
|---------|-------------|
| `supabase login` | Login to Supabase |
| `supabase init` | Initialize Supabase locally |
| `supabase start` | Start local Supabase |
| `supabase db reset` | Reset local database |
| `supabase functions deploy` | Deploy Edge Functions |
| `supabase gen types typescript --local > types/database.ts` | Generate types |

## 🎯 What's Included

✅ **Authentication**
- Email/password login
- Sign up with validation
- Protected routes
- Session management

✅ **Dashboard**
- Responsive sidebar navigation
- User profile dropdown
- Beautiful landing page
- Loading states & error boundaries

✅ **Pages Ready**
- Shipments
- Tracking
- Customers
- Carriers
- Invoices

✅ **Production Ready**
- TypeScript strict mode
- Security headers
- Input validation (Zod)
- Error handling
- Loading states

✅ **Edge Functions**
- Mock external API integration
- Shipment sync example
- Scheduled jobs ready

## 📝 Next Steps

### 1. Create Your Database Tables

Go to Supabase Dashboard → SQL Editor and run:

```sql
create table public.shipments (
  id uuid default gen_random_uuid() primary key,
  tracking_number text unique not null,
  status text not null,
  origin text,
  destination text,
  customer_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.shipments enable row level security;

create policy "Users can view their shipments"
  on public.shipments for select
  using (auth.uid() = customer_id);
```

### 2. Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### 4. Setup Edge Functions

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy
```

## 🔧 Common Tasks

### Add a New Page

1. Create: `app/(dashboard)/dashboard/your-feature/page.tsx`
2. Add to navigation: `components/layouts/sidebar.tsx`

### Add a New Component

1. Create: `components/ui/your-component.tsx`
2. Import and use in your pages

### Add External API Integration

1. Edit: `supabase/functions/fetch-external-data/index.ts`
2. Deploy: `supabase functions deploy fetch-external-data`

## 📚 Documentation

- [Full README](./README.md) - Complete documentation
- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

## 🆘 Troubleshooting

**Authentication not working?**
- Check Supabase URL and keys in `.env.local`
- Verify auth settings in Supabase dashboard

**Build errors?**
- Run `npm install` to ensure all dependencies
- Run `npm run type-check` to see TypeScript errors
- Delete `.next` folder and rebuild

**Database errors?**
- Check RLS policies are enabled
- Verify user has correct permissions
- Check Supabase logs in dashboard

## 🎨 Customization

### Change Colors

Edit `app/globals.css` - CSS variables:
```css
:root {
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}
```

### Change Logo

Edit `components/layouts/sidebar.tsx` and `app/page.tsx`

### Add Authentication Providers

Edit Supabase dashboard → Authentication → Providers

---

Need help? Check the [README.md](./README.md) for detailed documentation.

**Happy coding! 🚀**

