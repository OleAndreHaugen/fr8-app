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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie, Cell as PieCell } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type RouteData = Database['public']['Tables']['routes']['Row'];

interface ForwardRates {
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
    
    months.push({
      key: `rate${i - 1}`,
      name: displayName,
      monthIndex: i - 1,
    });
  }
  
  return months;
}

const MONTHS = getNext12Months();

interface RateChangeIndicatorProps {
  current: number;
  previous: number | null;
}

export function RateChangeIndicator({ current, previous }: RateChangeIndicatorProps) {
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

interface RateTrendChartProps {
  forward: ForwardRates;
  currentRate: number;
}

function RateTrendChart({ forward, currentRate }: RateTrendChartProps) {
  const chartData = MONTHS.map((month) => {
    const rate = forward[month.key as keyof ForwardRates];
    const actualRate = rate || currentRate;
    const change = actualRate - currentRate;
    
    return {
      month: month.name.split(' ')[0],
      rate: actualRate,
      change: change,
    };
  });

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
              props.payload.change > 0 ? 'Rate ↑' : props.payload.change < 0 ? 'Rate ↓' : 'Rate'
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
            dataKey="rate" 
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

interface CostBreakdownChartProps {
  route: RouteData;
}

function CostBreakdownChart({ route }: CostBreakdownChartProps) {
  const data = [
    { name: 'VLSFO', value: route.total_vlsfo || 0, color: '#3b82f6' },
    { name: 'LSMGO', value: route.total_lsmgo || 0, color: '#10b981' },
    { name: 'PDA', value: route.total_pda || 0, color: '#f59e0b' },
    { name: 'Misc', value: route.total_misc || 0, color: '#ef4444' },
    { name: 'Commission', value: route.comission || 0, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No cost breakdown available
      </div>
    );
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={40}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <PieCell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(0)}`, 'Cost']}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RouteCalculationCardProps {
  route: RouteData;
  showChart?: boolean;
  compact?: boolean;
  allowToggle?: boolean;
  globalState?: CardState;
}

type CardState = 'compact' | 'full' | 'full-with-chart';

export function RouteCalculationCard({ route, showChart = true, compact = false, allowToggle = false, globalState }: RouteCalculationCardProps) {
  const [cardState, setCardState] = useState<CardState>(() => {
    if (globalState) return globalState;
    if (compact) return 'compact';
    if (showChart) return 'full-with-chart';
    return 'full';
  });
  
  const forward = route.rates as unknown as ForwardRates | null;
  
  // Use global state if provided, otherwise use local state
  const currentState = globalState || cardState;
  
  // Get current rate from rate0
  const currentRate = forward?.rate0 || route.rate || 0;
  // Get previous rate from rate1 (next month) for comparison
  const previousRate = forward?.rate1 || null;
  
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

  const formatSysName = (sysName: string | null) => {
    if (!sysName) return 'Unnamed Route';
    // Truncate very long sys_name for display
    return sysName.length > 50 ? `${sysName.substring(0, 50)}...` : sysName;
  };
  
  if (currentState === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 border bg-white rounded-xl hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="font-medium text-sm">{formatSysName(route.sys_name)}</div>
          <div className="text-xs text-muted-foreground">{route.customer || 'No Customer'}</div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold text-sm">${currentRate.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">USD/MT</div>
          </div>
          <Badge variant={route.active ? "default" : "secondary"} className="text-xs">
            {route.active ? 'Active' : 'Inactive'}
          </Badge>
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
      </div>
    );
  }
  
  return (
    <Card className="overflow-hidden rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{formatSysName(route.sys_name)}</CardTitle>
            <CardDescription>{route.customer || 'No Customer'}</CardDescription>
            {route.route && (
              <div className="text-sm text-muted-foreground mt-1">{route.route}</div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold">${currentRate.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USD/MT</div>
            </div>
            <Badge variant={route.active ? "default" : "secondary"}>
              {route.active ? 'Active' : 'Inactive'}
            </Badge>
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
          {/* Route Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Load Port:</span>
              <div className="font-medium">{route.port_load || 'N/A'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Discharge Port:</span>
              <div className="font-medium">{route.port_disch || 'N/A'}</div>
            </div>
          </div>

          {/* Rate Comparison */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next Month Rate</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {previousRate ? `$${previousRate.toFixed(2)}` : 'N/A'}
              </span>
              <RateChangeIndicator current={currentRate} previous={previousRate} />
            </div>
          </div>
          
          {forward && currentState === 'full-with-chart' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Forward Rates (Next 12 Months)</h4>
              <div className="grid grid-cols-6 gap-2 text-xs mb-4">
                {MONTHS.map((month) => {
                  const rate = forward[month.key as keyof ForwardRates];
                  
                  return (
                    <div key={month.key} className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-medium">{month.name}</div>
                      <div className="text-muted-foreground">${rate?.toFixed(0) || 'N/A'}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Rate Trend Chart */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Rate Trend</h5>
                <RateTrendChart forward={forward} currentRate={currentRate} />
              </div>

              {/* Cost Breakdown */}
              <div className="mt-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Cost Breakdown</h5>
                <CostBreakdownChart route={route} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
