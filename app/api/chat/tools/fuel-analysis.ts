import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Define the fuel analysis tool schema
export const fuelAnalysisTool = {
  description: 'Analyze fuel prices and forward pricing data. This tool can discover available fuel types and products, analyze current prices, trends, comparisons, and forecasts. Use natural language queries to explore the data.',
  inputSchema: z.object({
    query: z.string().describe('Natural language query about fuel data (e.g., "show me current prices", "compare HSFO and VLSFO", "what fuel types are available")'),
    analysis_type: z.enum([
      'discover',
      'current_prices',
      'price_trends', 
      'forward_pricing',
      'price_comparison',
      'fuel_types',
      'products',
      'price_changes',
      'forecast_analysis'
    ]).optional().describe('Type of analysis to perform'),
    fuel_type_filter: z.string().optional().describe('Filter by fuel type (will be matched against available types)'),
    product_filter: z.string().optional().describe('Filter by product/port (will be matched against available products)'),
    months: z.array(z.number()).optional().describe('Specific months to analyze (1-12 for next 12 months)'),
    comparison_fuel: z.string().optional().describe('Fuel type to compare against'),
  }),
  execute: async (params: {
    query: string;
    analysis_type?: string;
    fuel_type_filter?: string;
    product_filter?: string;
    months?: number[];
    comparison_fuel?: string;    
  }) => {
    try {
      const supabase = await createClient();

      // First, get all available fuel data to understand what's available
      const { data: allFuelData, error } = await supabase
        .from('fuel')
        .select('*')
        .order('type', { ascending: true })
        .order('product', { ascending: true });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }      
      
      if (!allFuelData || allFuelData.length === 0) {
        return {
          success: false,
          message: 'No fuel data found in the database',
          data: null
        };
      }

      // Get available fuel types and products for discovery
      const availableTypes = [...new Set(allFuelData.map(f => f.type))].sort();
      const availableProducts = [...new Set(allFuelData.map(f => f.product))].sort();

      // Apply filters if provided
      let filteredData = allFuelData;
      
      if (params.fuel_type_filter) {
        // Use fuzzy matching for fuel types
        const matchedType = availableTypes.find(type => 
          type.toLowerCase().includes(params.fuel_type_filter!.toLowerCase()) ||
          params.fuel_type_filter!.toLowerCase().includes(type.toLowerCase())
        );
        if (matchedType) {
          filteredData = filteredData.filter(f => f.type === matchedType);
        }
      }
      
      if (params.product_filter) {
        // Use fuzzy matching for products/ports
        const matchedProducts = availableProducts.filter(product => 
          product.toLowerCase().includes(params.product_filter!.toLowerCase()) ||
          params.product_filter!.toLowerCase().includes(product.toLowerCase())
        );
        if (matchedProducts.length > 0) {
          filteredData = filteredData.filter(f => matchedProducts.includes(f.product));
        }
      }

      // Determine analysis type from query if not explicitly provided
      let analysisType = params.analysis_type;

      if (!analysisType) {
        const queryLower = params.query.toLowerCase();
        if (queryLower.includes('discover') || queryLower.includes('available') || queryLower.includes('what') || queryLower.includes('list')) {
          analysisType = 'discover';
        } else if (queryLower.includes('trend') || queryLower.includes('trending')) {
          analysisType = 'price_trends';
        } else if (queryLower.includes('forward') || queryLower.includes('forecast') || queryLower.includes('future')) {
          analysisType = 'forward_pricing';
        } else if (queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('versus')) {
          analysisType = 'price_comparison';
        } else if (queryLower.includes('change') || queryLower.includes('increase') || queryLower.includes('decrease')) {
          analysisType = 'price_changes';
        } else {
          analysisType = 'current_prices';
        }
      }
      
      // Perform analysis based on type
      switch (analysisType) {
        case 'discover':
          return discoverAvailableData(allFuelData, availableTypes, availableProducts, params);
          
        case 'current_prices':
          return analyzeCurrentPrices(filteredData, params);
          
        case 'price_trends':
          return analyzePriceTrends(filteredData, params);
          
        case 'forward_pricing':
          return analyzeForwardPricing(filteredData, params);
          
        case 'price_comparison':
          return analyzePriceComparison(filteredData, params);
          
        case 'fuel_types':
          return analyzeFuelTypes(filteredData, params);
          
        case 'products':
          return analyzeProducts(filteredData, params);
          
        case 'price_changes':
          return analyzePriceChanges(filteredData, params);
          
        case 'forecast_analysis':
          return analyzeForecast(filteredData, params);
          
        default:
          return {
            success: false,
            message: 'Invalid analysis type',
            data: null
          };
      }
    } catch (error) {
      console.error('Fuel analysis error:', error);
      return {
        success: false,
        message: `Error performing fuel analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      };
    }
  }
};

// Helper functions for different analysis types
function discoverAvailableData(data: any[], availableTypes: string[], availableProducts: string[], params: any) {  

  const content = {
    success: true,
    message: `Discovered ${availableTypes.length} fuel types with ${availableProducts.length} total products`,
    data: {
      analysis_type: 'discover',
      summary: {
        total_fuel_types: availableTypes.length,
        total_products: availableProducts.length,
        total_records: data.length
      },
      all_available_types: availableTypes,
      all_available_products: availableProducts,
    }
  };  

  return content;
}

function analyzeCurrentPrices(data: any[], params: any) {
  const results = data.map(fuel => ({
    type: fuel.type,
    product: fuel.product,
    current_price: fuel.price,
    previous_price: fuel.price_prev,
    price_change: fuel.price_prev ? fuel.price - fuel.price_prev : null,
    price_change_percent: fuel.price_prev ? ((fuel.price - fuel.price_prev) / fuel.price_prev * 100) : null,
    unit: 'USD/MT'
  }));
  
  return {
    success: true,
    message: `Current prices for ${results.length} fuel products`,
    data: {
      analysis_type: 'current_prices',
      results: results,
      summary: {
        total_products: results.length,
        average_price: results.reduce((sum, r) => sum + r.current_price, 0) / results.length,
        highest_price: Math.max(...results.map(r => r.current_price)),
        lowest_price: Math.min(...results.map(r => r.current_price))
      }
    }
  };
}

function analyzePriceTrends(data: any[], params: any) {
  const trends = data.map(fuel => {
    const forward = fuel.forward as any;
    if (!forward) return null;
    
    // Extract forward prices (price0-price11 for next 12 months)
    const forwardPrices = [];
    for (let i = 0; i < 12; i++) {
      const priceKey = `price${i}`;
      if (forward[priceKey]) {
        forwardPrices.push({
          month: i + 1,
          price: forward[priceKey]
        });
      }
    }
    
    return {
      type: fuel.type,
      product: fuel.product,
      current_price: fuel.price,
      forward_prices: forwardPrices,
      trend_direction: forwardPrices.length > 0 ? 
        (forwardPrices[forwardPrices.length - 1].price > fuel.price ? 'increasing' : 'decreasing') : 'stable'
    };
  }).filter(Boolean);
  
  return {
    success: true,
    message: `Price trends analysis for ${trends.length} fuel products`,
    data: {
      analysis_type: 'price_trends',
      results: trends,
      summary: {
        increasing_trends: trends.filter(t => t?.trend_direction === 'increasing').length,
        decreasing_trends: trends.filter(t => t?.trend_direction === 'decreasing').length,
        stable_trends: trends.filter(t => t?.trend_direction === 'stable').length
      }
    }
  };
}

function analyzeForwardPricing(data: any[], params: any) {
  const forwardData = data.map(fuel => {
    const forward = fuel.forward as any;
    if (!forward) return null;
    
    // Get next 12 months pricing
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const priceKey = `price${i}`;
      const monthKey = `price${monthNames[i].toLowerCase()}`;
      const price = forward[priceKey] || forward[monthKey];
      
      if (price) {
        months.push({
          month: monthNames[i],
          month_number: i + 1,
          price: price,
          change_from_current: price - fuel.price,
          change_percent: ((price - fuel.price) / fuel.price * 100)
        });
      }
    }
    
    return {
      type: fuel.type,
      product: fuel.product,
      current_price: fuel.price,
      forward_months: months,
      average_forward_price: months.length > 0 ? months.reduce((sum, m) => sum + m.price, 0) / months.length : null
    };
  }).filter(Boolean);
  
  return {
    success: true,
    message: `Forward pricing analysis for ${forwardData.length} fuel products`,
    data: {
      analysis_type: 'forward_pricing',
      results: forwardData,
      summary: {
        products_with_forward_data: forwardData.length,
        average_forward_premium: forwardData.reduce((sum, f) => 
          sum + (f?.average_forward_price ? f.average_forward_price - f.current_price : 0), 0) / forwardData.length
      }
    }
  };
}

function analyzePriceComparison(data: any[], params: any) {
  if (!params.comparison_fuel) {
    // Compare all fuel types
    const comparison: Record<string, any[]> = {};
    
    data.forEach(fuel => {
      if (!comparison[fuel.type]) {
        comparison[fuel.type] = [];
      }
      comparison[fuel.type].push({
        product: fuel.product,
        price: fuel.price,
        price_prev: fuel.price_prev
      });
    });
    
    return {
      success: true,
      message: `Price comparison across all fuel types`,
      data: {
        analysis_type: 'price_comparison',
        results: comparison,
        summary: {
          fuel_types: Object.keys(comparison),
          total_products: data.length
        }
      }
    };
  }
  
  // Compare specific fuel types
  const targetFuel = data.find(f => f.type === params.comparison_fuel);
  if (!targetFuel) {
    return {
      success: false,
      message: `Fuel type '${params.comparison_fuel}' not found`,
      data: null
    };
  }
  
  const comparisons = data.map(fuel => ({
    type: fuel.type,
    product: fuel.product,
    price: fuel.price,
    price_difference: fuel.price - targetFuel.price,
    price_difference_percent: ((fuel.price - targetFuel.price) / targetFuel.price * 100),
    compared_to: `${targetFuel.type} (${targetFuel.product})`
  }));
  
  return {
    success: true,
    message: `Price comparison with ${params.comparison_fuel}`,
    data: {
      analysis_type: 'price_comparison',
      results: comparisons,
      summary: {
        reference_fuel: `${targetFuel.type} - ${targetFuel.product}`,
        reference_price: targetFuel.price
      }
    }
  };
}

function analyzeFuelTypes(data: any[], params: any) {
  const fuelTypes: Record<string, any> = {};
  
  data.forEach(fuel => {
    if (!fuelTypes[fuel.type]) {
      fuelTypes[fuel.type] = {
        type: fuel.type,
        products: [],
        average_price: 0,
        min_price: Infinity,
        max_price: -Infinity,
        total_products: 0
      };
    }
    
    fuelTypes[fuel.type].products.push({
      product: fuel.product,
      price: fuel.price
    });
    
    fuelTypes[fuel.type].min_price = Math.min(fuelTypes[fuel.type].min_price, fuel.price);
    fuelTypes[fuel.type].max_price = Math.max(fuelTypes[fuel.type].max_price, fuel.price);
    fuelTypes[fuel.type].total_products++;
  });
  
  // Calculate averages
  Object.values(fuelTypes).forEach((ft: any) => {
    ft.average_price = ft.products.reduce((sum: number, p: any) => sum + p.price, 0) / ft.total_products;
  });
  
  return {
    success: true,
    message: `Fuel types analysis`,
    data: {
      analysis_type: 'fuel_types',
      results: Object.values(fuelTypes),
      summary: {
        total_fuel_types: Object.keys(fuelTypes).length,
        total_products: data.length
      }
    }
  };
}

function analyzeProducts(data: any[], params: any) {
  const products = data.map(fuel => ({
    type: fuel.type,
    product: fuel.product,
    price: fuel.price,
    price_prev: fuel.price_prev,
    price_change: fuel.price_prev ? fuel.price - fuel.price_prev : null,
    price_change_percent: fuel.price_prev ? ((fuel.price - fuel.price_prev) / fuel.price_prev * 100) : null
  }));
  
  return {
    success: true,
    message: `Products analysis`,
    data: {
      analysis_type: 'products',
      results: products,
      summary: {
        total_products: products.length,
        products_with_price_changes: products.filter(p => p.price_change !== null).length
      }
    }
  };
}

function analyzePriceChanges(data: any[], params: any) {
  const changes = data
    .filter(fuel => fuel.price_prev !== null)
    .map(fuel => ({
      type: fuel.type,
      product: fuel.product,
      current_price: fuel.price,
      previous_price: fuel.price_prev,
      price_change: fuel.price - fuel.price_prev,
      price_change_percent: ((fuel.price - fuel.price_prev) / fuel.price_prev * 100),
      change_direction: fuel.price > fuel.price_prev ? 'increase' : 'decrease'
    }))
    .sort((a, b) => Math.abs(b.price_change_percent) - Math.abs(a.price_change_percent));
  
  return {
    success: true,
    message: `Price changes analysis`,
    data: {
      analysis_type: 'price_changes',
      results: changes,
      summary: {
        total_changes: changes.length,
        increases: changes.filter(c => c.change_direction === 'increase').length,
        decreases: changes.filter(c => c.change_direction === 'decrease').length,
        largest_increase: changes.find(c => c.change_direction === 'increase'),
        largest_decrease: changes.find(c => c.change_direction === 'decrease')
      }
    }
  };
}

function analyzeForecast(data: any[], params: any) {
  const forecasts = data.map(fuel => {
    const forward = fuel.forward as any;
    if (!forward) return null;
    
    // Get forward prices for next 12 months
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const priceKey = `price${i}`;
      const monthKey = `price${monthNames[i].toLowerCase()}`;
      const price = forward[priceKey] || forward[monthKey];
      
      if (price) {
        months.push({
          month: monthNames[i],
          month_number: i + 1,
          price: price,
          change_from_current: price - fuel.price,
          change_percent: ((price - fuel.price) / fuel.price * 100)
        });
      }
    }
    
    if (months.length === 0) return null;
    
    // Calculate forecast metrics
    const avgForwardPrice = months.reduce((sum, m) => sum + m.price, 0) / months.length;
    const maxPrice = Math.max(...months.map(m => m.price));
    const minPrice = Math.min(...months.map(m => m.price));
    const trend = months[months.length - 1].price > months[0].price ? 'increasing' : 'decreasing';
    
    return {
      type: fuel.type,
      product: fuel.product,
      current_price: fuel.price,
      forecast_months: months,
      forecast_summary: {
        average_forward_price: avgForwardPrice,
        max_forecast_price: maxPrice,
        min_forecast_price: minPrice,
        price_range: maxPrice - minPrice,
        trend_direction: trend,
        overall_change_percent: ((avgForwardPrice - fuel.price) / fuel.price * 100)
      }
    };
  }).filter(Boolean);
  
  return {
    success: true,
    message: `Forecast analysis for ${forecasts.length} fuel products`,
    data: {
      analysis_type: 'forecast_analysis',
      results: forecasts,
      summary: {
        products_with_forecasts: forecasts.length,
        average_forecast_premium: forecasts.reduce((sum, f) => 
          sum + (f?.forecast_summary?.overall_change_percent || 0), 0) / forecasts.length
      }
    }
  };
}
