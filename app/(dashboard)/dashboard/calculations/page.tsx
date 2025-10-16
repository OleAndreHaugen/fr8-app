import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CalculationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">My Calculations</h1>
          <p className="text-muted-foreground">
            Manage your freight calculations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Calculation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">378</div>
            <p className="text-muted-foreground text-xs">311 Live Routes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
          <CardDescription>
            Your recent freight calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No calculations yet. Create your first calculation to get started.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

