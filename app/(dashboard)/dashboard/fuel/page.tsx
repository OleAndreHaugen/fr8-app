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
import { ChevronDown, X, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FuelPriceCard } from "@/components/fuel/fuel-price-card";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";

type FuelData = Database['public']['Tables']['fuel']['Row'];
type CardState = 'compact' | 'full' | 'full-with-chart';

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

export default function FuelPage() {
  const [fuelsData, setFuelsData] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [globalCardState, setGlobalCardState] = useState<CardState>('full');

  useEffect(() => {
    async function fetchFuelData() {
      try {
        const supabase = createClient();
        
        const { data: fuels, error } = await supabase
          .from('fuel')
          .select('*')          
          .order('product', { ascending: true })
          .order('type', { ascending: true });

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

  const handleStateChange = (value: string) => {
    setGlobalCardState(value as CardState);
  };

  const toggleOptions = [
    { value: 'compact', label: 'Small' },
    { value: 'full', label: 'Medium' },
    { value: 'full-with-chart', label: 'Large' }
  ];

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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Fuel Overview</h1>
        <p className="text-muted-foreground">
          Current fuel prices and 12-month forward pricing in USD
        </p>
      </div>

      {/* Filters Section */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center space-x-3">
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
              <SegmentedToggle
                options={toggleOptions}
                value={globalCardState}
                onValueChange={handleStateChange}
              />
            </div>
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
          <FuelPriceCard 
            key={fuel.id} 
            fuel={fuel} 
            compact={false} 
            showChart={false} 
            allowToggle={false}
            globalState={globalCardState}
          />
        ))}
      </div>

    </div>
  );
}