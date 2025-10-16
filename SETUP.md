# Quick Setup Guide

Follow these steps to get your FR8 Portal up and running.

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to Project Settings → API

## 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Copy these values from your Supabase project's API settings.

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Create Your First Account

1. Click "Get Started" or "Sign Up"
2. Enter your email and password
3. You'll be redirected to the dashboard

## 6. Setup Database Tables (Optional)

Once you're ready to add data:

1. Go to your Supabase Dashboard → SQL Editor
2. Create tables for your freight data
3. Enable Row Level Security (RLS)
4. Generate TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## 7. Deploy to Vercel (Optional)

```bash
npm install -g vercel
vercel
```

Add your environment variables in Vercel project settings.

## Next Steps

- **Add Database Tables**: Create shipments, customers, carriers tables
- **Setup Edge Functions**: Deploy background job functions to Supabase
- **Customize UI**: Modify components to match your brand
- **Add Features**: Build out the placeholder pages with real functionality

## Common Issues

### Authentication not working
- Check that your Supabase URL and keys are correct
- Verify email confirmations are disabled in Supabase Auth settings (for development)

### Middleware errors
- Make sure you're using Node.js 18+
- Clear `.next` folder and rebuild: `rm -rf .next && npm run dev`

### Types not matching
- Regenerate types after database changes
- Restart TypeScript server in your IDE

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review [Supabase Docs](https://supabase.com/docs)
- Review [Next.js Docs](https://nextjs.org/docs)

