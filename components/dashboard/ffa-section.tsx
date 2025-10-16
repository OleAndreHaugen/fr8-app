"use client";

import { FFAPriceCard } from "@/components/ffa/ffa-price-card";
import { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type FFAData = Database['public']['Tables']['ffa']['Row'];

export function DashboardFFASection() {
  const [ffaData, setFfaData] = useState<FFAData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFFAData() {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('ffa')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2); // Only get first 2 for dashboard

        if (error) {
          console.error('Error fetching FFA data:', error);
        } else {
          setFfaData(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFFAData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Forward Freight Agreements</h2>
            <p className="text-sm text-muted-foreground">Average FFA prices in USD</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-8"></div>
                </div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ffaData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Forward Freight Agreements</h2>
            <p className="text-sm text-muted-foreground">Average FFA prices in USD</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No FFA data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Forward Freight Agreements</h2>
          <p className="text-sm text-muted-foreground">Average FFA prices in USD</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ffaData.map((ffa) => (
          <FFAPriceCard key={ffa.id} ffa={ffa} compact={true} showChart={false} />
        ))}
      </div>
    </div>
  );
}
