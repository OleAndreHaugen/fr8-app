# Fuel Price Fetching Edge Function

## Overview

This Edge Function (`fetch-ffa`) fetches fuel prices from an external API and updates your Supabase `fuel` table. It's designed to be triggered by Supabase cron jobs.

## Setup

### 1. Set Environment Variables

In your Supabase project dashboard:

1. Go to **Settings** → **Edge Functions**
2. Add these secrets:

```
FUEL_API_KEY=your-actual-api-key-here
```

### 2. Update API Endpoint

In `supabase/functions/fetch-ffa/index.ts`, line 157:

```typescript
// Replace with your actual API endpoint
const response = await fetch('https://your-actual-api-endpoint.com/prices', options);
```

### 3. Deploy the Function

```bash
# Using npx (no installation needed)
npx supabase functions deploy fetch-ffa

# Or if you have Supabase CLI installed
supabase functions deploy fetch-ffa
```

## Testing

### Manual Test

```bash
# Test the function manually
curl -X POST 'https://your-project.supabase.co/functions/v1/fetch-ffa' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Check Logs

In Supabase Dashboard → **Edge Functions** → **fetch-ffa** → **Logs**

## Schedule with Cron

### Enable pg_cron Extension

1. Go to **Database** → **Extensions**
2. Enable `pg_cron`

### Create Cron Job

Run this SQL in **SQL Editor**:

```sql
-- Run every hour at minute 0
select cron.schedule(
  'fetch-fuel-prices',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/fetch-ffa',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- View scheduled jobs
select * from cron.job;

-- Unschedule if needed
-- select cron.unschedule('fetch-fuel-prices');
```

## How It Works

1. **Fetches fuel codes** from `fuel_codes` table
2. **Calls external API** with the codes
3. **Processes response** to extract prices by port and fuel type
4. **Clears existing data** in `fuel` table
5. **Inserts new prices** with forward pricing data
6. **Returns success/failure** status

## Data Flow

```
fuel_codes table → API call → Process prices → fuel table
```

## Error Handling

- ✅ API authentication errors
- ✅ Database connection errors
- ✅ Missing fuel codes
- ✅ API response parsing errors
- ✅ Database insert errors

## Monitoring

Check function execution in:
- **Supabase Dashboard** → **Edge Functions** → **Logs**
- **Database** → **Logs** for cron job execution

## Customization

### Historical Price Lookup

To implement historical price comparison, you can:

1. Create a `fuel_history` table
2. Store previous prices before updating
3. Use historical data for `price_prev` calculation

### Different API Endpoints

Modify the `getPrices` function to:
- Use different API parameters
- Handle different response formats
- Add retry logic for failed requests

## Troubleshooting

### Common Issues

1. **API Key Error**: Check `FUEL_API_KEY` secret is set
2. **No Fuel Codes**: Ensure `fuel_codes` table has data
3. **API Timeout**: Increase timeout in fetch options
4. **Database Errors**: Check RLS policies are correct

### Debug Mode

Add console.log statements to trace execution:

```typescript
console.log('Fuel codes fetched:', fuelCodes.length);
console.log('API response:', data);
console.log('Processed prices:', prices.length);
```

