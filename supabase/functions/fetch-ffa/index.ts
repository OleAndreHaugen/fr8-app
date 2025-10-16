// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
function sortDataByContractAndPeriod(data) {
  data.sort((a, b)=>{
    if (a.Contract < b.Contract) return -1;
    if (a.Contract > b.Contract) return 1;
    if (a.Period < b.Period) return -1;
    if (a.Period > b.Period) return 1;
    return 0;
  });
  return data;
}
function calculateMonthsToTargetDate(targetDate) {
  const currentDate = new Date();
  const targetMoment = new Date(targetDate);
  const diffInMilliseconds = targetMoment - currentDate;
  const diffInMonths = diffInMilliseconds / (1000 * 60 * 60 * 24 * 30.44);
  return Math.floor(diffInMonths);
}
function getMonthNameFromDate(date) {
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
  ];
  const targetDate = new Date(date);
  const monthIndex = targetDate.getMonth();
  const previousMonthIndex = (monthIndex + 12) % 12;
  const monthName = monthNames[previousMonthIndex];
  return monthName;
}
function getYesterday(days) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - days);
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  const year = yesterday.getFullYear();
  return `${day}/${month}/${year}`;
}
function getPeriodFrom() {
  const date = new Date();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const monthIndex = date.getMonth();
  const monthName = monthNames[monthIndex];
  const year = date.getFullYear().toString().slice(-2);
  const formattedDate = monthName + year;
  return formattedDate;
}
function getPeriodTo() {
  const currentDate = new Date();
  const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, currentDate.getDate());
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const monthIndex = futureDate.getMonth();
  const monthName = monthNames[monthIndex];
  const year = futureDate.getFullYear().toString().slice(-2);
  const formattedDate = monthName + year;
  return formattedDate;
}
// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
console.info('server started');
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const token = Deno.env.get("PROSMAR_API_TOKEN") || '8n8364wS64Wjawo5HnJxN8m4Bi5xcpz1';
    if (!token) {
      return new Response(JSON.stringify({
        error: "Missing PROSMAR_API_TOKEN secret"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const url = `https://systems.prosmar.no/tradeblotterapi/api/pricer/prices/getPrices?api_token=${encodeURIComponent(token)}`;
    const payload = {
      Contracts: DEFAULT_CONTRACTS,
      DateFrom: getYesterday(1),
      DateTo: getYesterday(0),
      PeriodFrom: getPeriodFrom(),
      PeriodTo: getPeriodTo()
    };
    const prosmarRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const text = await prosmarRes.text(); // pass-through as-is (some APIs return text)
    console.log(await prosmarRes.json());
    const contentType = prosmarRes.headers.get("content-type") || "application/json";
    return new Response(text, {
      status: prosmarRes.status,
      headers: {
        "Content-Type": contentType,
        ...corsHeaders
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
