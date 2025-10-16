import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Fetch Fuel Prices Function Started");

/**
 * Edge Function for fetching fuel prices from external API
 * This function:
 * - Fetches fuel codes from database
 * - Calls external API for current prices
 * - Processes and formats the data
 * - Updates the fuel table
 * - Can be triggered by Supabase cron jobs
 */

interface FuelCode {
  code: string;
  port: string;
}

interface FuelPrice {
  type: string;
  product: string;
  price: number;
  price_prev: number | null;
  forward: Record<string, number>;
}

interface ExternalPriceResponse {
  data: {
    prices: Array<{
      unlocode: string;
      grade: string;
      period_name: string;
      price: number;
    }>;
  };
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

    // Get fuel codes from database
    const { data: fuelCodes, error: codesError } = await supabase
      .from('fuel_codes')
      .select('code, port');

    if (codesError) {
      throw new Error(`Failed to fetch fuel codes: ${codesError.message}`);
    }

    if (!fuelCodes || fuelCodes.length === 0) {
      throw new Error("No fuel codes found in database");
    }

    const codesArray = fuelCodes.map((code: FuelCode) => code.code);

    console.log("codesArray", codesArray);

    // Fetch prices from external API
    const fuelPrices = await getPrices(codesArray, fuelCodes);

    if (fuelPrices.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No fuel prices retrieved from API",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Clear existing fuel data and insert new data
    const { error: clearError } = await supabase
      .from('fuel')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (clearError) {
      throw new Error(`Failed to clear fuel table: ${clearError.message}`);
    }

    const { error: insertError } = await supabase
      .from('fuel')
      .insert(fuelPrices);

    if (insertError) {
      throw new Error(`Failed to insert fuel prices: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fuel prices updated successfully",
        records_updated: fuelPrices.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching fuel prices:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch fuel prices",
        details: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function getPrices(codesArray: string[], fuelCodes: FuelCode[]): Promise<FuelPrice[]> {
  const prices: FuelPrice[] = [];
  const dateYesterday = formatDateToYYMMDD(getYesterday(1));

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('FUEL_API_KEY')
    },
    parameters: {
      unlocodes: codesArray,
      kind: "latest_intra_day",
      size: 100,
      format: "json"
    }
  };

  try {
    // Replace with your actual API endpoint
    const response = await fetch('https://api.public.zeronorth.app/bunker-pricing-external/v2/prices', options);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    console.log("response", response);

    const data: ExternalPriceResponse = await response.json();
    let fuel: Record<string, Record<string, number>> = {};

    for (let i = 0; i < data.data.prices.length; i++) {
      const price = data.data.prices[i];
      const bunker = fuelCodes.find((obj) => obj.code === price.unlocode);

      if (bunker) {
        const key = bunker.port + "_" + price.grade;

        if (price.period_name.indexOf("M") > -1) {
          const month = parseInt(price.period_name.substr(1, 2));
          const monthName = getMonthName(month);

          if (!fuel[key]) fuel[key] = {};

          fuel[key]["price" + month] = price.price;
          fuel[key]["price" + monthName] = price.price;
        }
      }
    }

    // Process fuel data and create price records
    for (const key in fuel) {
      const [product, type] = key.split("_");

      const currentPrice = fuel[key]["price0"] || 0;
      const previousPrice = fuel[key]["price0"] || 0; // You can implement historical lookup here

      prices.push({
        type,
        product,
        forward: fuel[key],
        price: currentPrice,
        price_prev: previousPrice,
      });
    }

    return prices;
  } catch (error) {
    console.error("Error fetching prices from API:", error);
    return [];
  }
}

function getMonthName(offset = 0): string {
  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const targetMonth = (currentMonth + offset) % 12;
  return months[targetMonth];
}

function formatDateToYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

function getYesterday(days: number): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - days);
  return yesterday;
}

