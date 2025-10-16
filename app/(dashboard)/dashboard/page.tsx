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
  const stats = [
    {
      name: "Calculations",
      value: "378",
      subtitle: "ROUTES",
      icon: Calculator,
      description: "311, Live Routes",
    },
    {
      name: "Live Offers",
      value: "1",
      subtitle: "ENTRIES",
      icon: TrendingUp,
      description: "My number of live offers",
    },
    {
      name: "Friends",
      value: "68",
      subtitle: "ACCEPTED",
      icon: Users,
      description: "2, Pending requests",
    },
    {
      name: "Badges",
      value: "255",
      subtitle: "POINTS",
      icon: Award,
      description: "385, Points achievable",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your freight operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Make Bid/Offer</Button>
          <Button variant="outline">Add business friend</Button>
          <Button variant="outline">Make PDF Report</Button>
          <Button variant="outline">Ask AI</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase">
                  {stat.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {stat.description}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="font-bold text-4xl">{stat.value}</div>
                <p className="font-medium text-muted-foreground text-xs uppercase">
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <DashboardFuelSection />
        <DashboardFFASection />

        <Card>
          <CardHeader>
            <CardTitle>FR8 Standard Routes</CardTitle>
            <CardDescription>Freight Prices in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Standard routes pricing will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

