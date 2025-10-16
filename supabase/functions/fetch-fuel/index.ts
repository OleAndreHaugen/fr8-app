// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Fetch External Data Function Started");

/**
 * Example Edge Function for fetching data from external APIs
 * This demonstrates how to:
 * - Fetch from external carrier/tracking APIs
 * - Process the data
 * - Store in Supabase
 * - Handle errors
 * 
 * Scheduling with pg_cron example:
 * 
 * select cron.schedule(
 *   'fetch-external-data',
 *   '0 * * * *', -- Every hour
 *   $$
 *   select net.http_post(
 *     url := 'https://your-project.supabase.co/functions/v1/fetch-external-data',
 *     headers := jsonb_build_object(
 *       'Authorization', 'Bearer YOUR_ANON_KEY',
 *       'Content-Type', 'application/json'
 *     )
 *   );
 *   $$
 * );
 */

interface ExternalApiResponse {
  data: Array<{
    tracking_number: string;
    status: string;
    location: string;
    timestamp: string;
  }>;
}

serve(async (req) => {
  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Example: Fetch from external API (replace with actual API)
    const externalApiKey = Deno.env.get("CARRIER_API_KEY");
    
    // Mock external API call - replace with actual API endpoint
    const mockData: ExternalApiResponse = {
      data: [
        {
          tracking_number: "TRACK123456",
          status: "in_transit",
          location: "Oslo, Norway",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // In production, you would do:
    // const response = await fetch('https://external-api.com/tracking', {
    //   headers: {
    //     'Authorization': `Bearer ${externalApiKey}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // const data = await response.json();

    // Process and store data
    // Example: Update tracking events (you'll need to create this table)
    // const { error: insertError } = await supabase
    //   .from('tracking_events')
    //   .upsert(mockData.data);

    // if (insertError) {
    //   throw insertError;
    // }

    return new Response(
      JSON.stringify({
        success: true,
        message: "External data fetched and processed successfully",
        records_processed: mockData.data.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching external data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch external data",
        details: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

