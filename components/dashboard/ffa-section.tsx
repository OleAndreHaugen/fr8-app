"use client";

import { FFAPriceCard } from "@/components/ffa/ffa-price-card";
import { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";

type FFAData = Database['public']['Tables']['ffa']['Row'];
type FFAHistData = Database['public']['Tables']['ffa_hist']['Row'];
type CardState = 'compact' | 'full' | 'full-with-chart';

// Contract mapping with names and sort order
const CONTRACT_MAPPING = {
  "Dry_10TC_S": { name: "Ultramax", sort: 3 },
  "Dry_5TC_P": { name: "Kamsarmax", sort: 2 },
  "Dry_Cape": { name: "Cape", sort: 1 },
  "Dry_Handy_38": { name: "Handy", sort: 4 },
} as const;

// Function to get contract name
function getContractName(contract: string): string {
  return CONTRACT_MAPPING[contract as keyof typeof CONTRACT_MAPPING]?.name || contract;
}

// Function to get contract sort order
function getContractSort(contract: string): number {
  return CONTRACT_MAPPING[contract as keyof typeof CONTRACT_MAPPING]?.sort || 999;
}

export function DashboardFFASection() {
  const [ffaData, setFfaData] = useState<FFAData[]>([]);
  const [ffaHistData, setFfaHistData] = useState<FFAHistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalCardState, setGlobalCardState] = useState<CardState>('full-with-chart');

  useEffect(() => {
    async function fetchFFAData() {
      try {
        const supabase = createClient();
        
        // Fetch current FFA data
        const { data: ffaData, error: ffaError } = await supabase
          .from('ffa')
          .select('*')
          .in('contract', Object.keys(CONTRACT_MAPPING))
          .order('created_at', { ascending: false });

        // Fetch historical FFA data
        const { data: ffaHistData, error: ffaHistError } = await supabase
          .from('ffa_hist')
          .select('*')
          .in('contract', Object.keys(CONTRACT_MAPPING))
          .order('created_at', { ascending: false });

        if (ffaError) {
          console.error('Error fetching FFA data:', ffaError);
        } else {
          // Sort by the predefined sort order
          const sortedData = (ffaData || []).sort((a, b) => {
            const sortA = getContractSort(a.contract);
            const sortB = getContractSort(b.contract);
            return sortA - sortB;
          });
          setFfaData(sortedData);
        }

        if (ffaHistError) {
          console.error('Error fetching FFA historical data:', ffaHistError);
        } else {
          setFfaHistData(ffaHistData || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
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

  // Helper function to find historical data for a contract
  const getHistoricalData = (contract: string): FFAHistData | undefined => {
    return ffaHistData.find(hist => hist.contract === contract);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>FFA</CardTitle>
            <CardDescription>Forward Freight Agreement Prices in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ffaData.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>FFA</CardTitle>
            <CardDescription>Forward Freight Agreement Prices in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-0 pt-4 border-t">
              <p className="text-sm">
                No FFA data available. Check back later for updated pricing information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }  

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FFA</CardTitle>
              <CardDescription>Forward Freight Agreement Prices in USD</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <span>
              </span>
              <SegmentedToggle
                options={toggleOptions}
                value={globalCardState}
                onValueChange={handleStateChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-0 pt-4 border-t">
            <p className="text-sm">
              Showing FFA prices for key dry bulk contracts: Cape, Kamsarmax, Ultramax, and Handy. 
              Prices include current rates and 12-month forward pricing trends for freight agreements.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FFA Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ffaData.map((ffa) => {
          // Create a modified FFA object with the display name
          const ffaWithDisplayName = {
            ...ffa,
            contract: getContractName(ffa.contract)
          };

          // Get historical data for this contract
          const historicalData = getHistoricalData(ffa.contract);

          return (
            <FFAPriceCard 
              key={ffa.id} 
              ffa={ffaWithDisplayName} 
              ffaHist={historicalData}
              compact={false} 
              showChart={true} 
              allowToggle={false}
              globalState={globalCardState}
            />
          );
        })}
      </div>
    </div>
  );
}
