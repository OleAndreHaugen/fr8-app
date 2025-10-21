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
import { ChevronDown, X, Filter, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RouteCalculationCard } from "@/components/calculations/route-calculation-card";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useUserProfile } from "@/hooks/use-user-profile";
import Link from "next/link";

type RouteData = Database['public']['Tables']['routes']['Row'];
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

export default function CalculationsPage() {
  const [routesData, setRoutesData] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedActiveStatus, setSelectedActiveStatus] = useState<string[]>([]);
  const [selectedLoadPorts, setSelectedLoadPorts] = useState<string[]>([]);
  const [selectedDischPorts, setSelectedDischPorts] = useState<string[]>([]);
  const [globalCardState, setGlobalCardState] = useState<CardState>('full');
  
  const { profile } = useUserProfile();

  useEffect(() => {
    async function fetchRoutesData() {
      try {
        if (!profile?.account_id) {
          setError('No account assigned. Please contact your administrator.');
          setLoading(false);
          return;
        }

        const supabase = createClient();
        
        const { data: routes, error } = await supabase
          .from('routes')
          .select('*')
          .eq('account_id', profile.account_id)
          .order('sys_name', { ascending: false });

        if (error) {
          console.error('Error fetching routes data:', error);
          setError(error.message);
        } else {
          setRoutesData(routes || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch routes data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      fetchRoutesData();
    }
  }, [profile]);

  const handleStateChange = (value: string) => {
    setGlobalCardState(value as CardState);
  };

  const toggleOptions = [
    { value: 'compact', label: 'Small' },
    { value: 'full', label: 'Medium' },
    { value: 'full-with-chart', label: 'Large' }
  ];

  // Filter the data based on selected filters
  const filteredRoutes = routesData.filter(route => {
    const customerMatch = selectedCustomers.length === 0 || 
      (route.customer && selectedCustomers.includes(route.customer));
    const routeMatch = selectedRoutes.length === 0 || 
      (route.route && selectedRoutes.includes(route.route));
    const activeMatch = selectedActiveStatus.length === 0 || 
      selectedActiveStatus.includes(route.active ? 'Active' : 'Inactive');
    const loadPortMatch = selectedLoadPorts.length === 0 || 
      (route.port_load && selectedLoadPorts.includes(route.port_load));
    const dischPortMatch = selectedDischPorts.length === 0 || 
      (route.port_disch && selectedDischPorts.includes(route.port_disch));
    
    return customerMatch && routeMatch && activeMatch && loadPortMatch && dischPortMatch;
  });

  // Get unique values for filter options
  const uniqueCustomers = [...new Set(routesData.map(r => r.customer).filter(Boolean))].sort() as string[];
  const uniqueRoutes = [...new Set(routesData.map(r => r.route).filter(Boolean))].sort() as string[];
  const uniqueLoadPorts = [...new Set(routesData.map(r => r.port_load).filter(Boolean))].sort() as string[];
  const uniqueDischPorts = [...new Set(routesData.map(r => r.port_disch).filter(Boolean))].sort() as string[];
  const activeStatusOptions = ['Active', 'Inactive'];

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCustomers([]);
    setSelectedRoutes([]);
    setSelectedActiveStatus([]);
    setSelectedLoadPorts([]);
    setSelectedDischPorts([]);
  };

  // Calculate stats
  const totalRoutes = routesData.length;
  const activeRoutes = routesData.filter(r => r.active).length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">My Calculations</h1>
          <p className="text-muted-foreground">
            Loading your freight calculations...
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
          <h1 className="font-bold text-3xl tracking-tight">My Calculations</h1>
          <p className="text-muted-foreground">
            Error loading calculations
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Failed to load calculations</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">My Calculations</h1>
          <p className="text-muted-foreground">
            Manage your freight calculations and route analysis
          </p>
        </div>
        <Link href="/dashboard/calculations/detail">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Calculation
          </Button>
        </Link>
      </div>

      {/* Filters Section */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center space-x-3">
              {(selectedCustomers.length > 0 || selectedRoutes.length > 0 || 
                selectedActiveStatus.length > 0 || selectedLoadPorts.length > 0 || 
                selectedDischPorts.length > 0) && (
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
              label="Customer"
              options={uniqueCustomers}
              selected={selectedCustomers}
              onSelectionChange={setSelectedCustomers}
            />
            <MultiSelectFilter
              label="Route"
              options={uniqueRoutes}
              selected={selectedRoutes}
              onSelectionChange={setSelectedRoutes}
            />
            <MultiSelectFilter
              label="Status"
              options={activeStatusOptions}
              selected={selectedActiveStatus}
              onSelectionChange={setSelectedActiveStatus}
            />
            <MultiSelectFilter
              label="Load Port"
              options={uniqueLoadPorts}
              selected={selectedLoadPorts}
              onSelectionChange={setSelectedLoadPorts}
            />
            <MultiSelectFilter
              label="Discharge Port"
              options={uniqueDischPorts}
              selected={selectedDischPorts}
              onSelectionChange={setSelectedDischPorts}
            />
            <div className="text-sm text-muted-foreground">
              Showing {filteredRoutes.length} of {routesData.length} calculations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations Grid */}
      {filteredRoutes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <p className="font-medium">No calculations found</p>
              <p className="text-sm mt-2">
                {routesData.length === 0 
                  ? "Create your first calculation to get started."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <RouteCalculationCard 
              key={route.id} 
              route={route} 
              compact={false} 
              showChart={false} 
              allowToggle={false}
              globalState={globalCardState}
            />
          ))}
        </div>
      )}
    </div>
  );
}

