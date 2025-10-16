"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { ArrowUp, ArrowDown, Minus, ChevronDown, X, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

type FuelData = Database['public']['Tables']['fuel']['Row'];

interface ForwardPricing {
  price0: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  price5: number;
  price6: number;
  price7: number;
  price8: number;
  price9: number;
  price10: number;
  price11: number;
  price12: number;
  pricejan: number;
  pricefeb: number;
  pricemar: number;
  priceapr: number;
  pricemay: number;
  pricejun: number;
  pricejul: number;
  priceaug: number;
  pricesep: number;
  priceoct: number;
  pricenov: number;
  pricedec: number;
  [key: string]: number; // Allow for dynamic keys
}

// Generate next 12 months from today
function getNext12Months() {
  const months = [];
  const today = new Date();
  
  for (let i = 1; i <= 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const displayName = `${monthName} ${year}`;
    
    // Map to the price keys used in the forward pricing data
    const priceKey = `price${monthName.toLowerCase()}`;
    
    months.push({
      key: priceKey,
      name: displayName,
      monthIndex: i - 1, // For price0, price1, etc.
    });
  }
  
  return months;
}

const MONTHS = getNext12Months();

interface PriceTrendChartProps {
  forward: ForwardPricing;
  currentPrice: number;
}

function PriceTrendChart({ forward, currentPrice }: PriceTrendChartProps) {
  // Prepare chart data including current price and forward prices
  const chartData = [
    { month: 'Now', price: currentPrice, change: 0 },
    ...MONTHS.map((month) => {
      // Try to get price from named month first, then fall back to sequential
      let price = forward[month.key as keyof ForwardPricing];
      if (!price && month.monthIndex !== undefined) {
        const sequentialKey = `price${month.monthIndex}` as keyof ForwardPricing;
        price = forward[sequentialKey];
      }
      
      const actualPrice = price || currentPrice;
      const change = actualPrice - currentPrice;
      
      return {
        month: month.name.split(' ')[0], // Just show month name for chart
        price: actualPrice,
        change: change,
      };
    }),
  ];

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9 }}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip 
            formatter={(value: number, _name: string, props: any) => [
              `$${value.toFixed(2)}`, 
              props.payload.change > 0 ? 'Price ↑' : props.payload.change < 0 ? 'Price ↓' : 'Price'
            ]}
            labelFormatter={(label) => label === 'Now' ? 'Current' : label}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Bar 
            dataKey="price" 
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.change > 0 ? '#96EDB6' : 
                  entry.change < 0 ? '#F47C7C' : 
                  '#6b7280'
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

function MultiSelectFilter({ label, options, selected, onSelectionChange }: MultiSelectFilterProps) {
  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter(item => item !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-4 w-4 mr-2" />
            {selected.length === 0 ? 'All' : `${selected.length} selected`}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Select {label}</span>
              {selected.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {options.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-muted cursor-pointer"
                  onClick={() => handleToggle(option)}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="rounded"
                  />
                  <span className="text-sm">{option}</span>
                </div>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PriceChangeIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (!previous) return <Minus className="h-4 w-4 text-gray-400" />;
  
  const change = current - previous;
  const changePercent = ((change / previous) * 100).toFixed(2);
  
  if (change > 0) {
    return (
      <div className="flex items-center text-green-600">
        <ArrowUp className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">+{change.toFixed(2)} ({changePercent}%)</span>
      </div>
    );
  } else if (change < 0) {
    return (
      <div className="flex items-center text-red-600">
        <ArrowDown className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{change.toFixed(2)} ({changePercent}%)</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-400">
        <Minus className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">No change</span>
      </div>
    );
  }
}

function FuelPriceCard({ fuel }: { fuel: FuelData }) {
  const forward = fuel.forward as unknown as ForwardPricing | null;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{fuel.type.toUpperCase()}</CardTitle>
            <CardDescription>{fuel.product}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${fuel.price.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">USD/MT</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Previous Close</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {fuel.price_prev ? `$${fuel.price_prev.toFixed(2)}` : 'N/A'}
              </span>
              <PriceChangeIndicator current={fuel.price} previous={fuel.price_prev} />
            </div>
          </div>
          
          {forward && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Forward Pricing (Next 12 Months)</h4>
              <div className="grid grid-cols-6 gap-2 text-xs mb-4">
                {MONTHS.map((month) => {
                  // Try to get price from named month first, then fall back to sequential
                  let price = forward[month.key as keyof ForwardPricing];
                  if (!price && month.monthIndex !== undefined) {
                    const sequentialKey = `price${month.monthIndex}` as keyof ForwardPricing;
                    price = forward[sequentialKey];
                  }
                  
                  return (
                    <div key={month.key} className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-medium">{month.name}</div>
                      <div className="text-muted-foreground">${price?.toFixed(0) || 'N/A'}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Price Trend Chart */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Price Trend</h5>
                <PriceTrendChart forward={forward} currentPrice={fuel.price} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FuelPage() {
  const [fuelsData, setFuelsData] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFuelData() {
      try {
        const supabase = createClient();
        
        const { data: fuels, error } = await supabase
          .from('fuel')
          .select('*')
          .order('type', { ascending: true })
          .order('product', { ascending: true });

        if (error) {
          console.error('Error fetching fuel data:', error);
          setError(error.message);
        } else {
          setFuelsData(fuels || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch fuel data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchFuelData();
  }, []);

  // Filter the data based on selected filters
  const filteredFuels = fuelsData.filter(fuel => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(fuel.type);
    const productMatch = selectedProducts.length === 0 || selectedProducts.includes(fuel.product);
    return typeMatch && productMatch;
  });

  // Get unique types and products for filter options
  const uniqueTypes = [...new Set(fuelsData.map(f => f.type))].sort();
  const uniqueProducts = [...new Set(fuelsData.map(f => f.product))].sort();

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedProducts([]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Fuel Overview</h1>
          <p className="text-muted-foreground">
            Loading fuel prices and forward pricing data...
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Fuel Overview</h1>
          <p className="text-muted-foreground">
            Error loading fuel data
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Failed to load fuel data</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Fuel Overview</h1>
        <p className="text-muted-foreground">
          Current fuel prices and 12-month forward pricing in USD
        </p>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {(selectedTypes.length > 0 || selectedProducts.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-8"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-4">
            <MultiSelectFilter
              label="Fuel Type"
              options={uniqueTypes}
              selected={selectedTypes}
              onSelectionChange={setSelectedTypes}
            />
            <MultiSelectFilter
              label="Product"
              options={uniqueProducts}
              selected={selectedProducts}
              onSelectionChange={setSelectedProducts}
            />
            <div className="text-sm text-muted-foreground">
              Showing {filteredFuels.length} of {fuelsData.length} products
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Prices Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFuels.map((fuel) => (
          <FuelPriceCard key={fuel.id} fuel={fuel} />
        ))}
      </div>
    </div>
  );
}

