"use client";

import { FFAPriceCard } from "@/components/ffa/ffa-price-card";
import { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useCardState } from "@/hooks/use-card-state";

type FFAData = Database['public']['Tables']['ffa']['Row'];
type FFAHistData = Database['public']['Tables']['ffa_hist']['Row'];
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

export default function RoutesPage() {
  const [ffaData, setFfaData] = useState<FFAData[]>([]);
  const [ffaHistData, setFfaHistData] = useState<FFAHistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [globalCardState, setGlobalCardState] = useCardState('ffa-page', 'full');

  useEffect(() => {
    async function fetchFFAData() {
      try {
        const supabase = createClient();
        
        // Fetch current FFA data
        const { data: ffaData, error: ffaError } = await supabase
          .from('ffa')
          .select('*')
          .order('contract', { ascending: true })
          .order('created_at', { ascending: false });

        // Fetch historical FFA data
        const { data: ffaHistData, error: ffaHistError } = await supabase
          .from('ffa_hist')
          .select('*')
          .order('contract', { ascending: true })
          .order('created_at', { ascending: false });

        if (ffaError) {
          console.error('Error fetching FFA data:', ffaError);
          setError(ffaError.message);
        } else {
          setFfaData(ffaData || []);
        }

        if (ffaHistError) {
          console.error('Error fetching FFA historical data:', ffaHistError);
          // Don't set error for historical data as it's not critical
        } else {
          setFfaHistData(ffaHistData || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch FFA data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchFFAData();
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
  const filteredFFA = ffaData.filter(ffa => {
    const contractMatch = selectedContracts.length === 0 || selectedContracts.includes(ffa.contract);
    return contractMatch;
  });

  // Get unique contracts for filter options
  const uniqueContracts = [...new Set(ffaData.map(f => f.contract))].sort();

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedContracts([]);
  };

  // Helper function to find historical data for a contract
  const getHistoricalData = (contract: string): FFAHistData | undefined => {
    return ffaHistData.find(hist => hist.contract === contract);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">FFA</h1>
          <p className="text-muted-foreground">
            Loading Forward Freight Agreement data...
          </p>
        </div>

        {/* Filters Section Skeleton */}
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse rounded-xl">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
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
          <h1 className="font-bold text-3xl tracking-tight">FFA</h1>
          <p className="text-muted-foreground">
            Error loading FFA data
          </p>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Failed to load FFA data</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">FFA</h1>
        <p className="text-muted-foreground">
          Forward Freight Agreement pricing and routes data
        </p>
      </div>

      {/* Filters Section */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center space-x-3">
              {(selectedContracts.length > 0) && (
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
              label="Contract"
              options={uniqueContracts}
              selected={selectedContracts}
              onSelectionChange={setSelectedContracts}
            />
            <div className="text-sm text-muted-foreground">
              Showing {filteredFFA.length} of {ffaData.length} contracts
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FFA Cards Grid */}
      {filteredFFA.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFFA.map((ffa) => {
            // Get historical data for this contract
            const historicalData = getHistoricalData(ffa.contract);

            return (
              <FFAPriceCard 
                key={ffa.id} 
                ffa={ffa} 
                ffaHist={historicalData}
                compact={false} 
                showChart={true} 
                allowToggle={false}
                globalState={globalCardState}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">No FFA data available</p>
            <p className="text-sm">Check back later for updated pricing information</p>
          </div>
        </div>
      )}
    </div>
  );
}

