import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

interface CalculationRequest {
  id: string;
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
      id = '', 
    } = body ?? {};


    const { data, error } = await supabase.functions.invoke("calculate", {
      body: { id: id },

    });
    if (error) console.error(error);    

    return NextResponse.json({ freightRate: data.freightRate });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
