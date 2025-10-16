import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Live Offers</h1>
          <p className="text-muted-foreground">
            My number of live offers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Make Bid/Offer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Live Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">1</div>
            <p className="text-muted-foreground text-xs">Entries</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
          <CardDescription>
            Your current live offers in the market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No active offers. Create your first offer to get started.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

