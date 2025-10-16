// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMonthName, monthFromPeriod, getYesterday, formatDateToYYMMDD } from "./utils.ts";
// ---- Env ----
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
//
// ---- Supabase client (service role, server-side only) ----
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    headers: {
      "x-application-name": "fetch-fuel"
    }
  }
});
//
Deno.serve(async (req)=>{
  /*
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  */ try {
    //
    // ---- 1) Pull fuel codes -> build unlocodes list ----
    const { data: fuelCodes, error: fcErr } = await supabase.from("fuel_codes").select("code, port");
    if (fcErr) throw new Error(`fuel_codes select failed: ${fcErr.message}`);
    const codesArray = fuelCodes.map((c)=>c.code);
    //
    // ---- 2) Fetch prices from your API (GET with query parameters) ----
    const params = new URLSearchParams({
      kind: "latest_intra_day",
      size: "100",
      format: "json"
    });
    for (const code of codesArray)params.append("unlocodes", code);
    const url = `https://api.public.zeronorth.app/bunker-pricing-external/v2/prices?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": "92fe31c1-4d0e-4852-81b1-771d4ecc909a",
        'Content-Type': 'application/json'
      }
    });
    const apiResp = await res.json();
    const fuelPricesRaw = apiResp?.prices ?? [];
    //
    // ---- Bail early if nothing to do ----
    if (fuelPricesRaw.length === 0) {
      return new Response(JSON.stringify({
        inserted: 0,
        cleared: 0,
        deleted_expired: 0,
        message: "No prices returned"
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    //
    // ---- 3) Build forward map per key (port + "_" + grade) ----
    // fuel[key]["price0"], ["price1"]..., and ["price" + monthName]
    const fuelMap = {};
    for (const price of fuelPricesRaw){
      const bunker = fuelCodes.find((obj)=>obj.code === price.unlocode);
      if (!bunker) continue;
      const key = `${bunker.port}_${price.grade}`;
      const m = monthFromPeriod(price.period_name);
      if (m === null) continue; // only map monthly periods
      if (!fuelMap[key]) fuelMap[key] = {};
      fuelMap[key][`price${m}`] = price.price;
      // Month name based on current month + m
      const now = new Date();
      const monthIdx = (now.getUTCMonth() + m) % 12;
      const monthName = getMonthName(monthIdx);
      fuelMap[key][`price${monthName}`] = price.price;
    }
    // ---- 4) Resolve price_prev from fr8_fuel_hist (yesterday..yesterday+4) ----
    // Build the rows to insert into fr8_fuel
    let dateYYYYMMDD = formatDateToYYMMDD(getYesterday(1));
    const rowsToInsert = [];
    for (const key of Object.keys(fuelMap)){
      const [product, type] = key.split("_");
      const forward = fuelMap[key];
      const price0 = forward["price0"];
      //
      // Look up yesterday; if missing, walk back 1..4 days
      let foundHist = null;
      let searchDate = dateYYYYMMDD;
      for(let i = 1; i <= 5; i++){
        const { data: hist, error: histErr } = await supabase.from("fuel_hist").select("price").eq("date", searchDate).eq("product", product).eq("type", type).maybeSingle();
        if (histErr) throw new Error(`fuel_hist lookup failed: ${histErr.message}`);
        if (hist) {
          foundHist = hist;
          break;
        }
        // next day back
        const d = getYesterday(i + 0);
        searchDate = formatDateToYYMMDD(d);
      }
      // Rows to add
      rowsToInsert.push({
        type,
        product,
        forward,
        price: price0 ?? null,
        price_prev: foundHist?.price ?? price0 ?? null
      });
    }
    //
    // ---- 5) Clear fuel then insert new snapshot ----
    // Clear
    let cleared = 0;
    {
      const { error: delErr, count } = await supabase.from("fuel").delete({
        count: "exact"
      }).neq("type", "__never__"); // delete all rows
      if (delErr) throw new Error(`fuel clear failed: ${delErr.message}`);
      cleared = count ?? 0;
    }
    // Insert
    const { error: insErr, count: inserted } = await supabase.from("fuel").insert(rowsToInsert, {
      count: "exact"
    });
    if (insErr) throw new Error(`fuel insert failed: ${insErr.message}`);
    //
    // Done
    return new Response(JSON.stringify({
      message: "Fuel prices updated",
      cleared,
      inserted: inserted ?? rowsToInsert.length,
      keys_processed: Object.keys(fuelMap).length
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
