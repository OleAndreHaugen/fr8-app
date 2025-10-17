import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

type FuelRow = Database['public']['Tables']['fuel']['Row'];
type FFARow = Database['public']['Tables']['ffa']['Row'];

type ForwardPrices = Record<string, number | null> | null | undefined;

interface CalculationRequest {
  calcAllRates: boolean;
  rate_load: number | null;
  rate_disch: number | null;
  total_vlsfo: number | null;
  total_lsmgo: number | null;
  total_pda: number | null;
  total_misc: number | null;
  intake: number | null;
  stemsize: number | null;
  duration: number | null;
  route: string | null;
  fuel: string | null;
  difference: number | null;
  commission: number | null;
  commission_adress: number | null;
  calcMonth: number | null;
}

function getMonthName(monthNumber: number): string {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Body
    const body = (await request.json()) as CalculationRequest;

    // Defaults + normalization
    let {
      total_vlsfo = 0,
      total_lsmgo = 0,
      total_pda = 0,
      total_misc = 0,
      intake = 0,
      stemsize = 0,
      duration = 0,
      route = '',
      fuel = '',
      difference = 0,
      commission = 0,
      commission_adress = 0,
      calcMonth = 10,
      calcAllRates = false,
    } = body ?? {};

    route = (route ?? '').trim();
    fuel = (fuel ?? '').trim();

    const size = intake || stemsize;

    // Validate required inputs (fail fast with 400)
    if (!size || !duration || !route || !fuel) {
      return NextResponse.json(
        {
          freightRate: 0,
          error:
            'Missing required fields: size (intake or stemsize), duration, route, and fuel are required.',
        },
        { status: 200 }
      );
    }

    if (!calcMonth) {
      calcMonth = new Date().getMonth() + 1;
    }

    async function calculateRate(calcMonth: number) {


      const monthKey = `price${getMonthName(calcMonth)}`;

      // ---- Fuel prices -------------------------------------------------------
      const { data: fuelRows, error: fuelErr } = await supabase
        .from('fuel')
        .select('*')
        .eq('product', fuel);

      if (fuelErr) {
        return NextResponse.json(
          { error: `Failed to fetch fuel data: ${fuelErr.message}` },
          { status: 500 }
        );
      }

      const findPrice = (rows: FuelRow[] | null | undefined, type: string) => {
        const row = rows?.find((r) => r.type === type);
        const forward = (row?.forward as ForwardPrices) ?? {};
        const raw = forward?.[monthKey];
        return (typeof raw === 'number' ? raw : Number(raw)) || 0;
      };

      const c_diff = difference || 0;
      const c_diff_month = 0; // Placeholder until route-based monthly diff is implemented
      const c_diff_month_unit: '' | '%' = ''; // Placeholder until unit handling is implemented

      let p_vlsfo = findPrice(fuelRows, 'vlsfo');
      let p_lsmgo = findPrice(fuelRows, 'mgo');

      if (c_diff) {
        p_vlsfo += c_diff;
        p_lsmgo += c_diff;
      }

      // ---- FFA / TCE ---------------------------------------------------------
      const { data: ffaRow, error: ffaErr } = await supabase
        .from('ffa')
        .select('*')
        .eq('contract', route)
        .single<FFARow>();

      if (ffaErr && ffaErr.code !== 'PGRST116') {
        // PGRST116 = No rows found; treat as zero rather than 500
        return NextResponse.json(
          { error: `Failed to fetch FFA data: ${ffaErr.message}` },
          { status: 500 }
        );
      }

      const forwardFFA = (ffaRow?.forward as ForwardPrices) ?? {};
      const p_ffa = (forwardFFA?.[monthKey] as number | null) ?? 0;

      let p_tce = p_ffa + c_diff_month;

      if (c_diff_month_unit && c_diff_month_unit === "%") {
        p_tce = p_ffa + (c_diff_month / 100) * p_ffa;
      }

      // ---- Costs -------------------------------------------------------------
      const c_vlsfo = p_vlsfo * (total_vlsfo || 0);
      const c_lsmgo = p_lsmgo * (total_lsmgo || 0);
      const c_pda = total_pda || 0;
      const c_misc = total_misc || 0;
      const t_cost1 = c_vlsfo + c_lsmgo + c_pda + c_misc;

      // Commission
      const c_com_total = commission || 0;
      const c_acom = commission_adress || 0;

      const t_cost_day = t_cost1 / (duration || 0);
      const t_tce_diff = p_tce + t_cost_day;
      const t_income = t_tce_diff * (duration || 0);
      const c_com_cost = t_income * (c_com_total / 100);
      const t_cost2 = t_cost1 + c_com_cost;

      const t_rate = (c_com_cost + t_income) / (size || 0);
      const t_rate_after_adcom = t_rate + t_rate * (c_acom / 100);

      return t_rate_after_adcom;

    }

    // Calculate Current Rate
    let freightRate = await calculateRate(calcMonth);
    let freightRates: any = {};

    // Calculate Forward Rates if asked for
    if (calcAllRates) {

      calcMonth++;

      for (let iMonths = 0; iMonths < 12; iMonths++) {
        if (calcMonth > 11) calcMonth = 0;
        freightRates["rate" + iMonths] = await calculateRate(calcMonth);
        calcMonth++;
      }
    }

    return NextResponse.json({ freightRate: freightRate, freightRates: freightRates });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
