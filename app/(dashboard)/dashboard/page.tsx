import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardFuelSection } from "@/components/dashboard/fuel-section";
import { DashboardFFASection } from "@/components/dashboard/ffa-section";

export default function DashboardPage() {

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your freight operations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <DashboardFuelSection />
        <DashboardFFASection />
      </div>
    </div>
  );
}

