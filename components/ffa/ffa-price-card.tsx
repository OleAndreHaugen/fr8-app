"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database } from "@/types/database";
import { ArrowUp, ArrowDown, Minus, Maximize2, Minimize2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type FFAData = Database['public']['Tables']['ffa']['Row'];

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
  [key: string]: number;
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

interface PriceChangeIndicatorProps {
  current: number;
  previous: number | null;
}

export function PriceChangeIndicator({ current, previous }: PriceChangeIndicatorProps) {
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

interface PriceTrendChartProps {
  forward: ForwardPricing;
  currentPrice: number;
}

function PriceTrendChart({ forward, currentPrice }: PriceTrendChartProps) {
  // Prepare chart data including current price and forward prices
  const chartData = [    
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

interface FFAPriceCardProps {
  ffa: FFAData;
  ffaHist?: FFAData;
  showChart?: boolean;
  compact?: boolean;
  allowToggle?: boolean;
  globalState?: CardState;
}

type CardState = 'compact' | 'full' | 'full-with-chart';

export function FFAPriceCard({ ffa, ffaHist, showChart = true, compact = false, allowToggle = false, globalState }: FFAPriceCardProps) {
  const [cardState, setCardState] = useState<CardState>(() => {
    if (globalState) return globalState;
    if (compact) return 'compact';
    if (showChart) return 'full-with-chart';
    return 'full';
  });
  
  const forward = ffa.forward as unknown as ForwardPricing | null;
  const forwardHist = ffaHist?.forward as unknown as ForwardPricing | null;
  
  // Get current price from price0 (current month)
  const currentPrice = forward?.price0 || 0;
  // Get previous price from historical data price0, fallback to null if no historical data
  const previousPrice = forwardHist?.price0 || null;  
  
  // Use global state if provided, otherwise use local state
  const currentState = globalState || cardState;
  
  const cycleState = () => {
    setCardState(prev => {
      switch (prev) {
        case 'compact': return 'full';
        case 'full': return 'full-with-chart';
        case 'full-with-chart': return 'compact';
        default: return 'compact';
      }
    });
  };

  const getToggleIcon = () => {
    switch (currentState) {
      case 'compact': return <Maximize2 className="h-4 w-4" />;
      case 'full': return <BarChart3 className="h-4 w-4" />;
      case 'full-with-chart': return <Minimize2 className="h-4 w-4" />;
      default: return <Maximize2 className="h-4 w-4" />;
    }
  };

  const getToggleTitle = () => {
    switch (currentState) {
      case 'compact': return 'Expand card';
      case 'full': return 'Show charts';
      case 'full-with-chart': return 'Minimize card';
      default: return 'Toggle layout';
    }
  };
  
  if (currentState === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 border bg-white rounded-xl hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="font-medium text-sm">{ffa.contract}</div>
          <div className="text-xs text-muted-foreground">Forward Freight Agreement</div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold text-sm">${currentPrice.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">USD</div>
          </div>
          <PriceChangeIndicator current={currentPrice} previous={previousPrice} />
        </div>
        {allowToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleState}
            className="h-8 w-8 p-0 ml-2"
            title={getToggleTitle()}
          >
            {getToggleIcon()}
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <Card className="overflow-hidden rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{ffa.contract}</CardTitle>
            <CardDescription>Forward Freight Agreement</CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USD</div>
            </div>
            {allowToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cycleState}
                className="h-8 w-8 p-0"
                title={getToggleTitle()}
              >
                {getToggleIcon()}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Previous Month</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {previousPrice ? `$${previousPrice.toFixed(2)}` : 'N/A'}
              </span>
              <PriceChangeIndicator current={currentPrice} previous={previousPrice} />
            </div>
          </div>
          
          {forward && currentState === 'full-with-chart' && (
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
                <PriceTrendChart forward={forward} currentPrice={currentPrice} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
