import { Database } from '@/types/database';

type RouteData = Database['public']['Tables']['routes']['Row'];

interface CalculationRequest {
  id: string;
  calcAllRates: boolean;
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

interface CalculationResult {
  freightRate: number;  
  freightRates: {
    rate0: number;
    rate1: number;
    rate2: number;
    rate3: number;
    rate4: number;
    rate5: number;
    rate6: number;
    rate7: number;
    rate8: number;
    rate9: number;
    rate10: number;
    rate11: number;
  };
  debug: any;
}

export async function calculateFreightRate(routeData: Partial<RouteData>, calcAllRates: boolean = false): Promise<CalculationResult> {
  try {
    // Prepare request data
    const requestData: CalculationRequest = {
      id: routeData.id || '',
      total_vlsfo: routeData.total_vlsfo || null,
      total_lsmgo: routeData.total_lsmgo || null,
      total_pda: routeData.total_pda || null,
      total_misc: routeData.total_misc || null,
      intake: routeData.intake || null,
      stemsize: routeData.stemsize || null,
      duration: routeData.duration || null,
      route: routeData.route || null,
      fuel: routeData.fuel || null,
      difference: routeData.difference || null,
      commission: routeData.commission || null,
      commission_adress: routeData.commission_adress || null,
      calcMonth: null, // Will default to current month in API
      calcAllRates: calcAllRates || false,
    };

    // Make API request
    const response = await fetch('/api/calculate-freight-rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Calculation failed');
    }

    const result: CalculationResult = await response.json();
    return result;
    
  } catch (error) {
    console.error('Freight calculation error:', error);
    throw error;
  }
}
