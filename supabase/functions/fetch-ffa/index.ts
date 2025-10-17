// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getYesterday, getPeriodFrom, getPeriodTo, calculateMonthsToTargetDate, getMonthNameFromDate } from "./utils.ts";
const DEFAULT_CONTRACTS = [
  "Dry_10TC_S_Fr8",
  "Dry_5TC_P_Fr8",
  "Dry_Cape_Fr8",
  "Dry_Handy_38_Fr8",
  "HS1_38_Fr8",
  "HS2_38_Fr8",
  "HS3_38_Fr8",
  "HS4_38_Fr8",
  "HS5_38_Fr8",
  "HS6_38_Fr8",
  "HS7_38_Fr8",
  "P1A_82_Fr8",
  "P2A_82_Fr8",
  "P3A_82_Fr8",
  "P4_82_Fr8",
  "P6_82_Fr8",
  "S10_58_Fr8",
  "S1B_58_Fr8",
  "S1C_58_Fr8",
  "S2_58_Fr8",
  "S3_58_Fr8",
  "S4A_58_Fr8",
  "S4B_58_Fr8",
  "S5_58_Fr8",
  "S8_58_Fr8",
  "S9_58_Fr8"
];
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
console.info('Starting FFA Fetch');
Deno.serve(async (req)=>{
  try {
    const token = '8n8364wS64Wjawo5HnJxN8m4Bi5xcpz1';
    const url = `https://systems.prosmar.no/tradeblotterapi/api/pricer/prices/getPrices?api_token=${encodeURIComponent(token)}`;
    const payload = {
      Contracts: DEFAULT_CONTRACTS,
      DateFrom: getYesterday(1),
      DateTo: getYesterday(0),
      PeriodFrom: getPeriodFrom(),
      PeriodTo: getPeriodTo()
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const resData = await res.json();
    //
    // Parse
    const Items = {};
    for(let i = 0; i < resData.Data.length; i++){
      const Row = resData.Data[i];
      const Contract = Row.Contract.split("_Fr8")[0];
      if (!Items[Contract]) {
        Items[Contract] = {};
      }
      const monthNumber = calculateMonthsToTargetDate(Row.Period);
      const monthName = getMonthNameFromDate(Row.Period);
      Items[Contract]["price" + monthNumber] = parseInt(Row.Price);
      Items[Contract]["price" + monthName] = parseInt(Row.Price);
    }
    //
    // Save in DB
    for(let key in Items){
      let { data: FFA, error: FFAErr } = await supabase.from("ffa").select().eq("contract", key);
      if (FFAErr) throw new Error(`FFA lookup failed: ${FFAErr.message}`);
      if (!FFA) {
        FFA = {
          contract: key
        };
      }
      FFA.forward = Items[key];
      const { error: savErr } = await supabase.from("ffa").upsert(FFA);
      if (savErr) throw new Error(`FFA save failed: ${savErr.message}`);
      //
      // Done
      return new Response(JSON.stringify({
        message: "FFA prices updated"
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
