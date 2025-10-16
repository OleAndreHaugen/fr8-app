"use client";

import { FFAPriceCard } from "@/components/ffa/ffa-price-card";
import { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type FFAData = Database['public']['Tables']['ffa']['Row'];

export default function RoutesPage() {
  const [ffaData, setFfaData] = useState<FFAData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFFAData() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('ffa')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching FFA data:', error);
          setError(error.message);
        } else {
          setFfaData(data || []);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">FFA/Routes</h1>
          <p className="text-muted-foreground">
            Loading Forward Freight Agreement data...
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">FFA/Routes</h1>
          <p className="text-muted-foreground">
            Error loading FFA data
          </p>
        </div>
        <Card>
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
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">FFA/Routes</h1>
        <p className="text-muted-foreground">
          Forward Freight Agreement pricing and routes data
        </p>
      </div>

      {ffaData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ffaData.map((ffa) => (
            <FFAPriceCard key={ffa.id} ffa={ffa} />
          ))}
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

