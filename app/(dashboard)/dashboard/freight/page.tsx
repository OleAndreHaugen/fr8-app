import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FreightPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">FR8 Freight</h1>
          <p className="text-muted-foreground">
            Standard freight routes and pricing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Route
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FR8 Standard Routes</CardTitle>
          <CardDescription>
            Freight prices in USD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            FR8 Standard Routes will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

