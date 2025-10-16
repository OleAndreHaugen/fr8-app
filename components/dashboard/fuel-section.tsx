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
import { useEffect, useState } from "react";
import { FuelPriceCard } from "@/components/fuel/fuel-price-card";

type FuelData = Database['public']['Tables']['fuel']['Row'];

// Specific locations and fuel types from the image
const DASHBOARD_FUEL_LOCATIONS = [
  { location: 'Antwerp', types: ['vlsfo', 'mgo'] },
  { location: 'Fujairah', types: ['vlsfo', 'mgo'] },
  { location: 'Gibraltar', types: ['vlsfo', 'mgo'] },
  { location: 'Rotterdam', types: ['vlsfo', 'mgo'] },
  { location: 'Singapore', types: ['vlsfo', 'mgo'] },
];

export function DashboardFuelSection() {
  const [fuelsData, setFuelsData] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(true);

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
        } else {
          // Filter for specific locations and types from the image
          const filteredFuels = fuels?.filter(fuel => 
            DASHBOARD_FUEL_LOCATIONS.some(loc => 
              loc.location === fuel.product && loc.types.includes(fuel.type)
            )
          ) || [];
          
          setFuelsData(filteredFuels);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFuelData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>FUEL</CardTitle>
            <CardDescription>Fuel Forward Prices in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate some stats for the header
  const totalProducts = fuelsData.length;
  const uniqueTypes = new Set(fuelsData.map(f => f.type)).size;
  const avgPrice = fuelsData.length > 0 
    ? (fuelsData.reduce((sum, f) => sum + f.price, 0) / fuelsData.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>FUEL</CardTitle>
          <CardDescription>Fuel Forward Prices in USD</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-0 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing fuel prices for key bunker locations: Antwerp, Fujairah, Gibraltar, Rotterdam, and Singapore. 
              Prices include VLSFO and MGO fuel types with current rates and 12-month forward pricing trends.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fuelsData.map((fuel) => (
          <FuelPriceCard key={fuel.id} fuel={fuel} compact={false} showChart={false} />
        ))}
      </div>
    </div>
  );
}